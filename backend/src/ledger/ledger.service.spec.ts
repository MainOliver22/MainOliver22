import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerService } from './ledger.service';
import { Account } from '../database/entities/account.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Asset } from '../database/entities/asset.entity';
import { AccountType } from '../database/enums/account-type.enum';
import { TransactionType } from '../database/enums/transaction-type.enum';
import { TransactionStatus } from '../database/enums/transaction-status.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryRunner = () => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
});

describe('LedgerService', () => {
  let service: LedgerService;
  let accountRepo: ReturnType<typeof mockRepo>;
  let ledgerEntryRepo: ReturnType<typeof mockRepo>;
  let transactionRepo: ReturnType<typeof mockRepo>;
  let dataSource: { createQueryRunner: jest.Mock };

  const qr = mockQueryRunner();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: getRepositoryToken(Account), useFactory: mockRepo },
        { provide: getRepositoryToken(LedgerEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
        { provide: getRepositoryToken(Asset), useFactory: mockRepo },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(qr) },
        },
      ],
    }).compile();

    service = module.get(LedgerService);
    accountRepo = module.get(getRepositoryToken(Account));
    ledgerEntryRepo = module.get(getRepositoryToken(LedgerEntry));
    transactionRepo = module.get(getRepositoryToken(Transaction));
    dataSource = module.get(DataSource);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getBalance ────────────────────────────────────────────────────────────────

  describe('getBalance', () => {
    it('returns account balance when account exists', async () => {
      accountRepo.findOne.mockResolvedValue({ balance: '250.5' });

      const balance = await service.getBalance('user-1', 'asset-1');
      expect(balance).toBe('250.5');
    });

    it('returns "0" when no account exists', async () => {
      accountRepo.findOne.mockResolvedValue(null);

      const balance = await service.getBalance('user-1', 'asset-1');
      expect(balance).toBe('0');
    });
  });

  // ── getOrCreateAccount ────────────────────────────────────────────────────────

  describe('getOrCreateAccount', () => {
    it('returns existing account without creating a new one', async () => {
      const existing = { id: 'acc-1', balance: '100' };
      accountRepo.findOne.mockResolvedValue(existing);

      const result = await service.getOrCreateAccount('user-1', 'asset-1', AccountType.USER_AVAILABLE);

      expect(result).toEqual(existing);
      expect(accountRepo.save).not.toHaveBeenCalled();
    });

    it('creates and returns a new account when none exists', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      const newAccount = { id: 'acc-new', balance: '0' };
      accountRepo.create.mockReturnValue(newAccount);
      accountRepo.save.mockResolvedValue(newAccount);

      const result = await service.getOrCreateAccount('user-1', 'asset-1', AccountType.USER_AVAILABLE);

      expect(accountRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newAccount);
    });
  });

  // ── createTransaction ─────────────────────────────────────────────────────────

  describe('createTransaction', () => {
    it('creates a transaction with PENDING status', async () => {
      const tx = { id: 'tx-1', status: TransactionStatus.PENDING };
      transactionRepo.create.mockReturnValue(tx);
      transactionRepo.save.mockResolvedValue(tx);

      const result = await service.createTransaction(TransactionType.DEPOSIT, 'Test deposit');

      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: TransactionStatus.PENDING }),
      );
      expect(result).toEqual(tx);
    });
  });

  // ── completeTransaction / failTransaction ─────────────────────────────────────

  describe('completeTransaction', () => {
    it('updates the transaction status to COMPLETED', async () => {
      transactionRepo.update.mockResolvedValue({});

      await service.completeTransaction('tx-1');

      expect(transactionRepo.update).toHaveBeenCalledWith('tx-1', {
        status: TransactionStatus.COMPLETED,
      });
    });
  });

  describe('failTransaction', () => {
    it('updates the transaction status to FAILED', async () => {
      transactionRepo.update.mockResolvedValue({});

      await service.failTransaction('tx-1');

      expect(transactionRepo.update).toHaveBeenCalledWith('tx-1', {
        status: TransactionStatus.FAILED,
      });
    });
  });

  // ── transfer ──────────────────────────────────────────────────────────────────

  describe('transfer', () => {
    it('commits the transfer and creates ledger entries on success', async () => {
      const fromAccount = { id: 'acc-from', balance: '500.0' };
      const toAccount = { id: 'acc-to', balance: '100.0' };

      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      mockQb.getOne
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      qr.manager.createQueryBuilder.mockReturnValue(mockQb);
      qr.manager.update.mockResolvedValue({});
      qr.manager.create.mockReturnValue({});
      qr.manager.save.mockResolvedValue([{}, {}]);

      await service.transfer({
        fromAccountId: 'acc-from',
        toAccountId: 'acc-to',
        amount: '200',
        transactionId: 'tx-1',
      });

      expect(qr.commitTransaction).toHaveBeenCalledTimes(1);
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows when source account not found', async () => {
      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      qr.manager.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.transfer({
          fromAccountId: 'missing',
          toAccountId: 'acc-to',
          amount: '100',
          transactionId: 'tx-1',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
