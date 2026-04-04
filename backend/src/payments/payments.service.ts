// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeConstructor = require('stripe');
import type { Stripe as StripeInstance } from 'stripe';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Deposit } from '../database/entities/deposit.entity';
import { Withdrawal } from '../database/entities/withdrawal.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerService } from '../ledger/ledger.service';
import { AccountType } from '../database/enums/account-type.enum';
import { TransactionType } from '../database/enums/transaction-type.enum';
import { DepositStatus } from '../database/enums/deposit-status.enum';
import { WithdrawalStatus } from '../database/enums/withdrawal-status.enum';
import { DepositMethod } from '../database/enums/deposit-method.enum';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { AmlService } from '../common/aml.service';
import { User } from '../database/entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: StripeInstance | null;

  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly ledgerService: LedgerService,
    private readonly configService: ConfigService,
    private readonly amlService: AmlService,
  ) {
    const stripeKey = this.configService.get<string>('PAYMENT_STRIPE_KEY');
    this.stripe = stripeKey ? (new StripeConstructor(stripeKey) as StripeInstance) : null;
  }

  async createDeposit(userId: string, dto: CreateDepositDto): Promise<Deposit> {
    const asset = await this.assetRepo.findOne({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException(`Asset ${dto.assetId} not found`);

    // If Stripe is configured and the deposit method is CARD, create a PaymentIntent
    if (this.stripe && dto.method === DepositMethod.CARD) {
      const amountCents = Math.round(parseFloat(dto.amount) * 100);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: asset.symbol.toLowerCase(),
        metadata: { userId, assetId: dto.assetId, amount: dto.amount },
      });

      const tx = await this.ledgerService.createTransaction(
        TransactionType.DEPOSIT,
        `Card deposit of ${dto.amount} ${asset.symbol}`,
        { method: dto.method, paymentIntentId: paymentIntent.id },
        uuid(),
      );

      const deposit = this.depositRepo.create({
        userId,
        assetId: dto.assetId,
        transactionId: tx.id,
        amount: dto.amount,
        method: dto.method,
        provider: 'stripe',
        externalId: paymentIntent.id,
        metadata: { ...(dto.metadata ?? {}), paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret },
        status: DepositStatus.PENDING,
      });
      await this.depositRepo.save(deposit);

      return this.depositRepo.findOne({ where: { id: deposit.id }, relations: ['asset'] }) as Promise<Deposit>;
    }

    const tx = await this.ledgerService.createTransaction(
      TransactionType.DEPOSIT,
      `Deposit of ${dto.amount} ${asset.symbol}`,
      { method: dto.method },
      uuid(),
    );

    const deposit = this.depositRepo.create({
      userId,
      assetId: dto.assetId,
      transactionId: tx.id,
      amount: dto.amount,
      method: dto.method,
      metadata: dto.metadata ?? null,
      status: DepositStatus.PENDING,
    });
    await this.depositRepo.save(deposit);

    // Mock: immediately credit user account from system hot wallet
    const systemAccount = await this.ledgerService.getOrCreateAccount(
      null,
      dto.assetId,
      AccountType.SYSTEM_HOT_WALLET,
    );
    const userAccount = await this.ledgerService.getOrCreateAccount(
      userId,
      dto.assetId,
      AccountType.USER_AVAILABLE,
    );

    // Ensure system account has enough balance for demo
    const sysBalance = parseFloat(systemAccount.balance);
    const depositAmount = parseFloat(dto.amount);
    if (sysBalance < depositAmount) {
      await this.accountRepo.update(systemAccount.id, {
        balance: (sysBalance + depositAmount * 10).toFixed(8),
      });
    }

    await this.ledgerService.transfer({
      fromAccountId: systemAccount.id,
      toAccountId: userAccount.id,
      amount: dto.amount,
      transactionId: tx.id,
      description: `Deposit credit for user ${userId}`,
    });

    await this.depositRepo.update(deposit.id, { status: DepositStatus.CONFIRMED });
    await this.ledgerService.completeTransaction(tx.id);

    return this.depositRepo.findOne({ where: { id: deposit.id }, relations: ['asset'] }) as Promise<Deposit>;
  }

  async getDeposits(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Deposit[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.depositRepo.findAndCount({
      where: { userId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const asset = await this.assetRepo.findOne({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException(`Asset ${dto.assetId} not found`);

    // AML/sanctions screening
    const addressScreen = this.amlService.screenAddress(dto.toAddress ?? null);
    if (addressScreen.blocked) {
      throw new BadRequestException('Withdrawal blocked: sanctions screening failed');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      const nameScreen = this.amlService.screenName(user.firstName, user.lastName);
      if (nameScreen.blocked) {
        throw new BadRequestException('Withdrawal blocked: sanctions screening failed');
      }
    }

    const balance = await this.ledgerService.getBalance(userId, dto.assetId);
    if (parseFloat(balance) < parseFloat(dto.amount)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${balance} ${asset.symbol}`,
      );
    }

    const tx = await this.ledgerService.createTransaction(
      TransactionType.WITHDRAWAL,
      `Withdrawal of ${dto.amount} ${asset.symbol}`,
      { method: dto.method },
    );

    const withdrawal = this.withdrawalRepo.create({
      userId,
      assetId: dto.assetId,
      transactionId: tx.id,
      amount: dto.amount,
      method: dto.method,
      toAddress: dto.toAddress ?? null,
      bankDetails: dto.bankDetails ?? null,
      status: WithdrawalStatus.PENDING_APPROVAL,
    });
    await this.withdrawalRepo.save(withdrawal);

    // Lock funds: move from USER_AVAILABLE to USER_LOCKED
    const availableAccount = await this.ledgerService.getOrCreateAccount(
      userId,
      dto.assetId,
      AccountType.USER_AVAILABLE,
    );
    const lockedAccount = await this.ledgerService.getOrCreateAccount(
      userId,
      dto.assetId,
      AccountType.USER_LOCKED,
    );

    await this.ledgerService.transfer({
      fromAccountId: availableAccount.id,
      toAccountId: lockedAccount.id,
      amount: dto.amount,
      transactionId: tx.id,
      description: `Withdrawal lock for user ${userId}`,
    });

    return this.withdrawalRepo.findOne({ where: { id: withdrawal.id }, relations: ['asset'] }) as Promise<Withdrawal>;
  }

  async getWithdrawals(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Withdrawal[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.withdrawalRepo.findAndCount({
      where: { userId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async handleDepositWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    this.logger.log(`Webhook received. Signature: ${signature}`);

    if (!this.stripe) {
      this.logger.warn('PAYMENT_STRIPE_KEY not set — ignoring deposit webhook');
      return { received: true };
    }

    const webhookSecret = this.configService.get<string>('PAYMENT_STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      const isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';
      if (!isDev) {
        throw new BadRequestException('Webhook secret not configured');
      }
      this.logger.warn('PAYMENT_STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
      return { received: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as { id: string; client_secret: string | null };
      const deposit = await this.depositRepo.findOne({
        where: { externalId: paymentIntent.id },
        relations: ['asset'],
      });

      if (deposit && deposit.status === DepositStatus.PENDING) {
        const asset = deposit.asset;

        // Credit user account
        const systemAccount = await this.ledgerService.getOrCreateAccount(
          null,
          deposit.assetId,
          AccountType.SYSTEM_HOT_WALLET,
        );
        const userAccount = await this.ledgerService.getOrCreateAccount(
          deposit.userId,
          deposit.assetId,
          AccountType.USER_AVAILABLE,
        );

        const sysBalance = parseFloat(systemAccount.balance);
        const depositAmount = parseFloat(deposit.amount);
        if (sysBalance < depositAmount) {
          await this.accountRepo.update(systemAccount.id, {
            balance: (sysBalance + depositAmount * 10).toFixed(8),
          });
        }

        const tx = await this.ledgerService.createTransaction(
          TransactionType.DEPOSIT,
          `Stripe card deposit confirmed: ${deposit.amount} ${asset?.symbol ?? ''}`,
          { paymentIntentId: paymentIntent.id },
          uuid(),
        );

        await this.ledgerService.transfer({
          fromAccountId: systemAccount.id,
          toAccountId: userAccount.id,
          amount: deposit.amount,
          transactionId: tx.id,
          description: `Stripe deposit credit for user ${deposit.userId}`,
        });

        await this.depositRepo.update(deposit.id, { status: DepositStatus.CONFIRMED });
        await this.ledgerService.completeTransaction(tx.id);
        this.logger.log(`Stripe deposit ${deposit.id} confirmed for user ${deposit.userId}`);
      }
    }

    return { received: true };
  }

  async approveWithdrawal(withdrawalId: string, adminUserId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });
    if (!withdrawal) throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);

    await this.withdrawalRepo.update(withdrawalId, {
      status: WithdrawalStatus.APPROVED,
      approvedBy: adminUserId,
      approvedAt: new Date(),
    });
    await this.withdrawalRepo.update(withdrawalId, { status: WithdrawalStatus.COMPLETED });

    if (withdrawal.transactionId) {
      await this.ledgerService.completeTransaction(withdrawal.transactionId);
    }

    return this.withdrawalRepo.findOne({ where: { id: withdrawalId }, relations: ['asset'] }) as Promise<Withdrawal>;
  }

  async rejectWithdrawal(
    withdrawalId: string,
    adminUserId: string,
    reason: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });
    if (!withdrawal) throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);

    await this.withdrawalRepo.update(withdrawalId, {
      status: WithdrawalStatus.REJECTED,
      rejectionReason: reason,
      approvedBy: adminUserId,
    });

    // Refund: move from USER_LOCKED back to USER_AVAILABLE
    const lockedAccount = await this.ledgerService.getOrCreateAccount(
      withdrawal.userId,
      withdrawal.assetId,
      AccountType.USER_LOCKED,
    );
    const availableAccount = await this.ledgerService.getOrCreateAccount(
      withdrawal.userId,
      withdrawal.assetId,
      AccountType.USER_AVAILABLE,
    );

    const refundTx = await this.ledgerService.createTransaction(
      TransactionType.ADJUSTMENT,
      `Refund of rejected withdrawal ${withdrawalId}`,
    );

    await this.ledgerService.transfer({
      fromAccountId: lockedAccount.id,
      toAccountId: availableAccount.id,
      amount: withdrawal.amount,
      transactionId: refundTx.id,
      description: `Rejection refund for withdrawal ${withdrawalId}`,
    });

    await this.ledgerService.completeTransaction(refundTx.id);
    if (withdrawal.transactionId) {
      await this.ledgerService.failTransaction(withdrawal.transactionId);
    }

    return this.withdrawalRepo.findOne({ where: { id: withdrawalId }, relations: ['asset'] }) as Promise<Withdrawal>;
  }

  async getAllDeposits(
    page: number,
    limit: number,
  ): Promise<{ items: Deposit[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.depositRepo.findAndCount({
      relations: ['asset', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getAllWithdrawals(
    page: number,
    limit: number,
  ): Promise<{ items: Withdrawal[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.withdrawalRepo.findAndCount({
      relations: ['asset', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }
}
