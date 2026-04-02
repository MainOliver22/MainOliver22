import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycCase } from '../database/entities/kyc-case.entity';
import { KycDocument } from '../database/entities/kyc-document.entity';
import { KycStatus } from '../database/enums/kyc-status.enum';
import { KycLevel } from '../database/enums/kyc-level.enum';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycCase)
    private readonly kycCaseRepo: Repository<KycCase>,
    @InjectRepository(KycDocument)
    private readonly kycDocumentRepo: Repository<KycDocument>,
  ) {}

  async startKyc(userId: string, level: KycLevel) {
    const existing = await this.kycCaseRepo.findOne({
      where: { userId, status: KycStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('A KYC case is already pending for this user');
    }

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
      redirectUrl: `https://kyc-provider.example.com/session/${kycCase.id}`,
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
    this.logger.log(`KYC webhook received: signature=${signature} payload=${JSON.stringify(body)}`);

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
