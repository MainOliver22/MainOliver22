import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Asset } from '../database/entities/asset.entity';
import { AccountType } from '../database/enums/account-type.enum';
import { EntryType } from '../database/enums/entry-type.enum';
import { TransactionType } from '../database/enums/transaction-type.enum';
import { TransactionStatus } from '../database/enums/transaction-status.enum';

export interface TransferParams {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  transactionId: string;
  description?: string;
}

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateAccount(
    userId: string | null,
    assetId: string,
    accountType: AccountType,
  ): Promise<Account> {
    const existing = await this.accountRepo.findOne({
      where: { userId, assetId, type: accountType },
    });
    if (existing) return existing;

    const account = this.accountRepo.create({
      userId,
      assetId,
      type: accountType,
      balance: '0',
    });
    return this.accountRepo.save(account);
  }

  async getBalance(userId: string, assetId: string): Promise<string> {
    const account = await this.accountRepo.findOne({
      where: { userId, assetId, type: AccountType.USER_AVAILABLE },
    });
    return account?.balance ?? '0';
  }

  async getBalances(userId: string): Promise<Account[]> {
    return this.accountRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.asset', 'asset')
      .where('account.userId = :userId', { userId })
      .andWhere('CAST(account.balance AS DECIMAL) != 0')
      .orderBy('asset.symbol', 'ASC')
      .getMany();
  }

  async transfer(params: TransferParams): Promise<void> {
    const { fromAccountId, toAccountId, amount, transactionId } = params;
    const numericAmount = parseFloat(amount);

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromAccount = await queryRunner.manager
        .createQueryBuilder(Account, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: fromAccountId })
        .getOne();

      if (!fromAccount) throw new NotFoundException('Source account not found');

      const toAccount = await queryRunner.manager
        .createQueryBuilder(Account, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: toAccountId })
        .getOne();

      if (!toAccount) throw new NotFoundException('Destination account not found');

      const fromBalance = parseFloat(fromAccount.balance);
      const toBalance = parseFloat(toAccount.balance);

      const newFromBalance = (fromBalance - numericAmount).toFixed(8);
      const newToBalance = (toBalance + numericAmount).toFixed(8);

      await queryRunner.manager.update(Account, fromAccountId, { balance: newFromBalance });
      await queryRunner.manager.update(Account, toAccountId, { balance: newToBalance });

      const debitEntry = queryRunner.manager.create(LedgerEntry, {
        transactionId,
        accountId: fromAccountId,
        amount,
        balanceAfter: newFromBalance,
        entryType: EntryType.DEBIT,
      });

      const creditEntry = queryRunner.manager.create(LedgerEntry, {
        transactionId,
        accountId: toAccountId,
        amount,
        balanceAfter: newToBalance,
        entryType: EntryType.CREDIT,
      });

      await queryRunner.manager.save(LedgerEntry, [debitEntry, creditEntry]);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createTransaction(
    type: TransactionType,
    description?: string,
    metadata?: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    const tx = this.transactionRepo.create({
      type,
      status: TransactionStatus.PENDING,
      description: description ?? null,
      metadata: metadata ?? null,
      idempotencyKey: idempotencyKey ?? null,
    });
    return this.transactionRepo.save(tx);
  }

  async completeTransaction(transactionId: string): Promise<void> {
    await this.transactionRepo.update(transactionId, {
      status: TransactionStatus.COMPLETED,
    });
  }

  async failTransaction(transactionId: string): Promise<void> {
    await this.transactionRepo.update(transactionId, {
      status: TransactionStatus.FAILED,
    });
  }

  async getLedgerEntries(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: LedgerEntry[]; total: number; page: number; limit: number }> {
    const userAccounts = await this.accountRepo.find({ where: { userId } });
    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [items, total] = await this.ledgerEntryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.account', 'account')
      .leftJoinAndSelect('account.asset', 'asset')
      .leftJoinAndSelect('entry.transaction', 'transaction')
      .where('entry.accountId IN (:...accountIds)', { accountIds })
      .orderBy('entry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
