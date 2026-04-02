import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
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
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

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
    private readonly ledgerService: LedgerService,
  ) {}

  async createDeposit(userId: string, dto: CreateDepositDto): Promise<Deposit> {
    const asset = await this.assetRepo.findOne({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException(`Asset ${dto.assetId} not found`);

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

  handleDepositWebhook(body: unknown, signature: string): { received: boolean } {
    this.logger.log(`Webhook received. Signature: ${signature}, body: ${JSON.stringify(body)}`);
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
