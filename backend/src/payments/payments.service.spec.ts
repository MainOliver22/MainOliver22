import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Deposit } from '../database/entities/deposit.entity';
import { Withdrawal } from '../database/entities/withdrawal.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { User } from '../database/entities/user.entity';
import { LedgerService } from '../ledger/ledger.service';
import { AmlService } from '../common/aml.service';
import { DepositMethod } from '../database/enums/deposit-method.enum';
import { WithdrawalStatus } from '../database/enums/withdrawal-status.enum';
import { AccountType } from '../database/enums/account-type.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockLedgerService = () => ({
  createTransaction: jest.fn(),
  completeTransaction: jest.fn(),
  failTransaction: jest.fn(),
  transfer: jest.fn(),
  getOrCreateAccount: jest.fn(),
  getBalance: jest.fn(),
});

const mockAmlService = () => ({
  screenAddress: jest.fn().mockReturnValue({ blocked: false }),
  screenName: jest.fn().mockReturnValue({ blocked: false }),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let depositRepo: ReturnType<typeof mockRepo>;
  let withdrawalRepo: ReturnType<typeof mockRepo>;
  let assetRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let ledgerService: ReturnType<typeof mockLedgerService>;
  let amlService: ReturnType<typeof mockAmlService>;

  const mockAsset = { id: 'asset-1', symbol: 'USD' } as Asset;
  const mockTx = { id: 'tx-1' };
  const mockSystemAccount = { id: 'sys-acc', balance: '1000000' } as Account;
  const mockUserAccount = { id: 'user-acc', balance: '0' } as Account;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Deposit), useFactory: mockRepo },
        { provide: getRepositoryToken(Withdrawal), useFactory: mockRepo },
        { provide: getRepositoryToken(Asset), useFactory: mockRepo },
        { provide: getRepositoryToken(Account), useFactory: mockRepo },
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
        { provide: getRepositoryToken(LedgerEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: LedgerService, useFactory: mockLedgerService },
        { provide: AmlService, useFactory: mockAmlService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(null) },
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
    depositRepo = module.get(getRepositoryToken(Deposit));
    withdrawalRepo = module.get(getRepositoryToken(Withdrawal));
    assetRepo = module.get(getRepositoryToken(Asset));
    userRepo = module.get(getRepositoryToken(User));
    ledgerService = module.get(LedgerService);
    amlService = module.get(AmlService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── createDeposit ─────────────────────────────────────────────────────────────

  describe('createDeposit', () => {
    it('creates a deposit and credits the user account', async () => {
      assetRepo.findOne.mockResolvedValue(mockAsset);
      ledgerService.createTransaction.mockResolvedValue(mockTx);
      ledgerService.getOrCreateAccount
        .mockResolvedValueOnce(mockSystemAccount)
        .mockResolvedValueOnce(mockUserAccount);
      ledgerService.transfer.mockResolvedValue(undefined);
      ledgerService.completeTransaction.mockResolvedValue(undefined);

      const createdDeposit = { id: 'dep-1' };
      depositRepo.create.mockReturnValue(createdDeposit);
      depositRepo.save.mockResolvedValue(createdDeposit);
      depositRepo.findOne.mockResolvedValue({ ...createdDeposit, asset: mockAsset });

      const result = await service.createDeposit('user-1', {
        assetId: 'asset-1',
        amount: '100',
        method: DepositMethod.BANK_TRANSFER,
      });

      expect(ledgerService.createTransaction).toHaveBeenCalledTimes(1);
      expect(ledgerService.transfer).toHaveBeenCalledTimes(1);
      expect(ledgerService.completeTransaction).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'dep-1');
    });

    it('throws NotFoundException when asset not found', async () => {
      assetRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createDeposit('user-1', { assetId: 'bad', amount: '100', method: DepositMethod.BANK_TRANSFER }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── createWithdrawal ──────────────────────────────────────────────────────────

  describe('createWithdrawal', () => {
    it('creates a withdrawal and locks funds', async () => {
      assetRepo.findOne.mockResolvedValue(mockAsset);
      userRepo.findOne.mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
      ledgerService.getBalance.mockResolvedValue('500');
      ledgerService.createTransaction.mockResolvedValue(mockTx);
      ledgerService.getOrCreateAccount
        .mockResolvedValueOnce(mockUserAccount)
        .mockResolvedValueOnce({ id: 'locked-acc', balance: '0' });
      ledgerService.transfer.mockResolvedValue(undefined);

      const createdWithdrawal = { id: 'wd-1' };
      withdrawalRepo.create.mockReturnValue(createdWithdrawal);
      withdrawalRepo.save.mockResolvedValue(createdWithdrawal);
      withdrawalRepo.findOne.mockResolvedValue({ ...createdWithdrawal, asset: mockAsset });

      const result = await service.createWithdrawal('user-1', {
        assetId: 'asset-1',
        amount: '100',
        method: 'BANK' as never,
        toAddress: '0xabc',
      });

      expect(ledgerService.transfer).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'wd-1');
    });

    it('throws NotFoundException when asset not found', async () => {
      assetRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createWithdrawal('user-1', {
          assetId: 'bad',
          amount: '100',
          method: 'BANK' as never,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('blocks withdrawal when address is on sanctions list', async () => {
      assetRepo.findOne.mockResolvedValue(mockAsset);
      (amlService.screenAddress as jest.Mock).mockReturnValue({
        blocked: true,
        reason: 'OFAC match',
      });

      await expect(
        service.createWithdrawal('user-1', {
          assetId: 'asset-1',
          amount: '100',
          method: 'BANK' as never,
          toAddress: '0xsanctioned',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks withdrawal when user balance is insufficient', async () => {
      assetRepo.findOne.mockResolvedValue(mockAsset);
      userRepo.findOne.mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
      ledgerService.getBalance.mockResolvedValue('50');

      await expect(
        service.createWithdrawal('user-1', {
          assetId: 'asset-1',
          amount: '100',
          method: 'BANK' as never,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getDeposits ───────────────────────────────────────────────────────────────

  describe('getDeposits', () => {
    it('returns paginated deposits for a user', async () => {
      const deposits = [{ id: 'dep-1' }, { id: 'dep-2' }];
      depositRepo.findAndCount.mockResolvedValue([deposits, 2]);

      const result = await service.getDeposits('user-1', 1, 10);

      expect(result.deposits).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  // ── getWithdrawals ────────────────────────────────────────────────────────────

  describe('getWithdrawals', () => {
    it('returns paginated withdrawals for a user', async () => {
      const withdrawals = [{ id: 'wd-1' }];
      withdrawalRepo.findAndCount.mockResolvedValue([withdrawals, 1]);

      const result = await service.getWithdrawals('user-1', 1, 10);

      expect(result.withdrawals).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ── approveWithdrawal / rejectWithdrawal ──────────────────────────────────────

  describe('approveWithdrawal', () => {
    it('approves a withdrawal and completes the transaction', async () => {
      const withdrawal = { id: 'wd-1', status: WithdrawalStatus.PENDING_APPROVAL, transactionId: 'tx-1' };
      withdrawalRepo.findOne
        .mockResolvedValueOnce(withdrawal)
        .mockResolvedValueOnce({ ...withdrawal, status: WithdrawalStatus.COMPLETED, asset: mockAsset });
      withdrawalRepo.update.mockResolvedValue({});
      ledgerService.completeTransaction.mockResolvedValue(undefined);

      const result = await service.approveWithdrawal('wd-1', 'admin-1');

      expect(withdrawalRepo.update).toHaveBeenCalled();
      expect(ledgerService.completeTransaction).toHaveBeenCalledWith('tx-1');
    });

    it('throws NotFoundException for unknown withdrawal', async () => {
      withdrawalRepo.findOne.mockResolvedValue(null);

      await expect(service.approveWithdrawal('missing', 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectWithdrawal', () => {
    it('rejects withdrawal and refunds locked funds', async () => {
      const withdrawal = {
        id: 'wd-1',
        userId: 'user-1',
        assetId: 'asset-1',
        amount: '100',
        transactionId: 'tx-1',
      };
      withdrawalRepo.findOne
        .mockResolvedValueOnce(withdrawal)
        .mockResolvedValueOnce({ ...withdrawal, asset: mockAsset });
      withdrawalRepo.update.mockResolvedValue({});
      ledgerService.getOrCreateAccount
        .mockResolvedValueOnce({ id: 'locked-acc' })
        .mockResolvedValueOnce({ id: 'avail-acc' });
      ledgerService.createTransaction.mockResolvedValue({ id: 'refund-tx' });
      ledgerService.transfer.mockResolvedValue(undefined);
      ledgerService.completeTransaction.mockResolvedValue(undefined);
      ledgerService.failTransaction.mockResolvedValue(undefined);

      await service.rejectWithdrawal('wd-1', 'admin-1', 'Suspicious activity');

      expect(ledgerService.transfer).toHaveBeenCalledTimes(1);
      expect(ledgerService.failTransaction).toHaveBeenCalledWith('tx-1');
    });
  });
});
