import * as crypto from 'crypto';
import * as https from 'https';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KycCase } from '../database/entities/kyc-case.entity';
import { KycStatus } from '../database/enums/kyc-status.enum';
import { KycLevel } from '../database/enums/kyc-level.enum';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycCase)
    private readonly kycCaseRepo: Repository<KycCase>,
    private readonly configService: ConfigService,
  ) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('KYC_API_KEY');
  }

  private get webhookSecret(): string | undefined {
    return this.configService.get<string>('KYC_WEBHOOK_SECRET');
  }

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'https://app.example.com');
  }

  /** Make an HTTPS request to the Onfido REST API v3.6 */
  private onfidoRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : undefined;
      const req = https.request(
        {
          hostname: 'api.eu.onfido.com',
          path: `/v3.6${path}`,
          method,
          headers: {
            Authorization: `Token token=${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(raw) as T;
              if ((res.statusCode ?? 0) >= 400) {
                reject(new Error(`Onfido API error ${res.statusCode}: ${raw}`));
              } else {
                resolve(parsed);
              }
            } catch {
              reject(new Error(`Failed to parse Onfido response: ${raw}`));
            }
          });
        },
      );
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  async startKyc(userId: string, level: KycLevel) {
    const existing = await this.kycCaseRepo.findOne({
      where: { userId, status: KycStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('A KYC case is already pending for this user');
    }

    if (!this.apiKey) {
      this.logger.warn('KYC_API_KEY is not set — using mock KYC behavior');
      const kycCase = this.kycCaseRepo.create({
        userId,
        level,
        status: KycStatus.PENDING,
        provider: 'mock',
        submittedAt: new Date(),
      });
      await this.kycCaseRepo.save(kycCase);
      return {
        caseId: kycCase.id,
        sdkToken: null,
        redirectUrl: `${this.frontendUrl}/kyc/mock/${kycCase.id}`,
      };
    }

    // Create Onfido applicant
    const applicant = await this.onfidoRequest<{ id: string }>('POST', '/applicants', {
      first_name: 'Unknown',
      last_name: 'User',
    });

    const kycCase = this.kycCaseRepo.create({
      userId,
      level,
      status: KycStatus.PENDING,
      provider: 'onfido',
      externalId: applicant.id,
      submittedAt: new Date(),
    });
    await this.kycCaseRepo.save(kycCase);

    // Generate SDK token
    const tokenResponse = await this.onfidoRequest<{ token: string }>('POST', '/sdk_token', {
      applicant_id: applicant.id,
      referrer: `${this.frontendUrl}/*`,
    });

    return {
      caseId: kycCase.id,
      sdkToken: tokenResponse.token,
      redirectUrl: `${this.frontendUrl}/kyc/session/${kycCase.id}`,
    };
  }

  async getStatus(userId: string) {
    const kycCase = await this.kycCaseRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!kycCase) {
      throw new NotFoundException('No KYC case found for this user');
    }
    return kycCase;
  }

  async handleWebhook(body: Record<string, unknown>, signature: string) {
    this.logger.log(`KYC webhook received: signature=${signature}`);

    const secret = this.webhookSecret;

    if (secret) {
      // Verify HMAC-SHA256 signature from X-SHA2-Signature header
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expectedBuf = Buffer.from(expectedSig, 'utf8');

      if (
        sigBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expectedBuf)
      ) {
        throw new BadRequestException('Invalid webhook signature');
      }

      // Handle Onfido check.completed event
      const payload = body['payload'] as Record<string, unknown> | undefined;
      const action = payload?.['action'] as string | undefined;
      const object = payload?.['object'] as Record<string, unknown> | undefined;

      if (action === 'check.completed' && object) {
        const result = object['result'] as string | undefined;
        const href = object['href'] as string | undefined;
        // Extract applicant id from the check — look in `links.applicant` or use externalId mapping via href
        const applicantId = object['applicant_id'] as string | undefined;

        if (applicantId) {
          const kycCase = await this.kycCaseRepo.findOne({
            where: { externalId: applicantId },
          });
          if (kycCase) {
            const statusMap: Record<string, KycStatus> = {
              clear: KycStatus.APPROVED,
              consider: KycStatus.IN_REVIEW,
              unidentified: KycStatus.REJECTED,
            };
            const mapped = result ? statusMap[result] : undefined;
            if (mapped) {
              kycCase.status = mapped;
              if (mapped === KycStatus.APPROVED || mapped === KycStatus.REJECTED) {
                kycCase.reviewedAt = new Date();
              }
              await this.kycCaseRepo.save(kycCase);
              this.logger.log(`KYC case ${kycCase.id} updated to ${mapped} (href=${href})`);
            }
          }
        }
      }
    } else {
      // Mock/legacy webhook: no secret configured
      const caseId = body['caseId'] as string | undefined;
      const incomingStatus = body['status'] as string | undefined;

      if (caseId && incomingStatus) {
        const kycCase = await this.kycCaseRepo.findOne({ where: { id: caseId } });
        if (kycCase) {
          const statusMap: Record<string, KycStatus> = {
            APPROVED: KycStatus.APPROVED,
            REJECTED: KycStatus.REJECTED,
            IN_REVIEW: KycStatus.IN_REVIEW,
          };
          const mapped = statusMap[incomingStatus.toUpperCase()];
          if (mapped) {
            kycCase.status = mapped;
            if (mapped === KycStatus.APPROVED || mapped === KycStatus.REJECTED) {
              kycCase.reviewedAt = new Date();
            }
            await this.kycCaseRepo.save(kycCase);
          }
        }
      }
    }

    return { received: true };
  }

  async getAdminQueue(
    status: KycStatus | undefined,
    page: number,
    limit: number,
  ) {
    const query = this.kycCaseRepo
      .createQueryBuilder('kycCase')
      .leftJoinAndSelect('kycCase.user', 'user')
      .orderBy('kycCase.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.where('kycCase.status = :status', { status });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit };
  }

  async approveCase(id: string, reviewedBy: string) {
    const kycCase = await this.kycCaseRepo.findOne({ where: { id } });
    if (!kycCase) {
      throw new NotFoundException('KYC case not found');
    }
    kycCase.status = KycStatus.APPROVED;
    kycCase.reviewedBy = reviewedBy;
    kycCase.reviewedAt = new Date();
    return this.kycCaseRepo.save(kycCase);
  }

  async rejectCase(id: string, reviewedBy: string, reason: string) {
    const kycCase = await this.kycCaseRepo.findOne({ where: { id } });
    if (!kycCase) {
      throw new NotFoundException('KYC case not found');
    }
    kycCase.status = KycStatus.REJECTED;
    kycCase.reviewedBy = reviewedBy;
    kycCase.reviewedAt = new Date();
    kycCase.rejectionReason = reason;
    return this.kycCaseRepo.save(kycCase);
  }
}
