import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ExchangeOrder } from '../database/entities/exchange-order.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerService } from '../ledger/ledger.service';
import { PriceFeedService } from '../common/price-feed.service';
import { ExchangeOrderStatus } from '../database/enums/exchange-order-status.enum';

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
  transfer: jest.fn(),
  getOrCreateAccount: jest.fn(),
  getBalance: jest.fn(),
});

const mockPriceFeedService = () => ({
  getMockRate: jest.fn(),
});

describe('ExchangeService', () => {
  let service: ExchangeService;
  let orderRepo: ReturnType<typeof mockRepo>;
  let assetRepo: ReturnType<typeof mockRepo>;
  let accountRepo: ReturnType<typeof mockRepo>;
  let ledgerService: ReturnType<typeof mockLedgerService>;
  let priceFeedService: ReturnType<typeof mockPriceFeedService>;

  const btcAsset = { id: 'btc', symbol: 'BTC' } as Asset;
  const usdAsset = { id: 'usd', symbol: 'USD' } as Asset;
  const mockTx = { id: 'tx-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        { provide: getRepositoryToken(ExchangeOrder), useFactory: mockRepo },
        { provide: getRepositoryToken(Asset), useFactory: mockRepo },
        { provide: getRepositoryToken(Account), useFactory: mockRepo },
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
        { provide: getRepositoryToken(LedgerEntry), useFactory: mockRepo },
        { provide: LedgerService, useFactory: mockLedgerService },
        { provide: PriceFeedService, useFactory: mockPriceFeedService },
      ],
    }).compile();

    service = module.get(ExchangeService);
    orderRepo = module.get(getRepositoryToken(ExchangeOrder));
    assetRepo = module.get(getRepositoryToken(Asset));
    accountRepo = module.get(getRepositoryToken(Account));
    ledgerService = module.get(LedgerService);
    priceFeedService = module.get(PriceFeedService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getQuote ──────────────────────────────────────────────────────────────────

  describe('getQuote', () => {
    it('creates a quoted exchange order with correct amounts', async () => {
      assetRepo.findOne
        .mockResolvedValueOnce(btcAsset)
        .mockResolvedValueOnce(usdAsset);
      priceFeedService.getMockRate.mockResolvedValue(65000); // 1 BTC = $65,000

      const savedOrder = { id: 'order-1', status: ExchangeOrderStatus.QUOTED };
      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);
      orderRepo.findOne.mockResolvedValue({ ...savedOrder, fromAsset: btcAsset, toAsset: usdAsset });

      const result = await service.getQuote('user-1', {
        fromAssetId: 'btc',
        toAssetId: 'usd',
        fromAmount: '1',
      });

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ExchangeOrderStatus.QUOTED }),
      );
      expect(result.id).toBe('order-1');
    });

    it('throws NotFoundException when fromAsset not found', async () => {
      assetRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getQuote('user-1', { fromAssetId: 'bad', toAssetId: 'usd', fromAmount: '1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when toAsset not found', async () => {
      assetRepo.findOne
        .mockResolvedValueOnce(btcAsset)
        .mockResolvedValueOnce(null);

      await expect(
        service.getQuote('user-1', { fromAssetId: 'btc', toAssetId: 'bad', fromAmount: '1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── executeExchange ───────────────────────────────────────────────────────────

  describe('executeExchange', () => {
    const quotedOrder = {
      id: 'order-1',
      userId: 'user-1',
      fromAssetId: 'btc',
      toAssetId: 'usd',
      fromAmount: '1',
      toAmount: '64675',
      fromAsset: btcAsset,
      toAsset: usdAsset,
      status: ExchangeOrderStatus.QUOTED,
      quoteExpiresAt: new Date(Date.now() + 30_000),
    } as ExchangeOrder;

    it('executes a valid quote and returns a FILLED order', async () => {
      orderRepo.findOne
        .mockResolvedValueOnce(quotedOrder)
        .mockResolvedValueOnce({ ...quotedOrder, status: ExchangeOrderStatus.FILLED });
      orderRepo.update.mockResolvedValue({});
      ledgerService.getBalance.mockResolvedValue('5'); // user has 5 BTC
      ledgerService.createTransaction.mockResolvedValue(mockTx);
      ledgerService.getOrCreateAccount.mockResolvedValue({ id: 'acc', balance: '999999' });
      ledgerService.transfer.mockResolvedValue(undefined);
      ledgerService.completeTransaction.mockResolvedValue(undefined);
      accountRepo.update.mockResolvedValue({});

      const result = await service.executeExchange('user-1', { quoteId: 'order-1' });

      expect(orderRepo.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: ExchangeOrderStatus.FILLED }),
      );
    });

    it('throws NotFoundException for unknown quote', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.executeExchange('user-1', { quoteId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quote is not in QUOTED state', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...quotedOrder,
        status: ExchangeOrderStatus.FILLED,
      });

      await expect(
        service.executeExchange('user-1', { quoteId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quote has expired', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...quotedOrder,
        quoteExpiresAt: new Date(Date.now() - 1000), // expired
      });
      orderRepo.update.mockResolvedValue({});

      await expect(
        service.executeExchange('user-1', { quoteId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user has insufficient balance', async () => {
      orderRepo.findOne.mockResolvedValue(quotedOrder);
      ledgerService.getBalance.mockResolvedValue('0.1'); // only 0.1 BTC

      await expect(
        service.executeExchange('user-1', { quoteId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getHistory ────────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('returns paginated orders for a user', async () => {
      const orders = [{ id: 'o1' }, { id: 'o2' }];
      orderRepo.findAndCount.mockResolvedValue([orders, 2]);

      const result = await service.getHistory('user-1', 1, 10);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
