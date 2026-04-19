import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotStrategy } from '../database/entities/bot-strategy.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { Trade } from '../database/entities/trade.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerService } from '../ledger/ledger.service';
import { PriceFeedService } from '../common/price-feed.service';
import { BotInstanceStatus } from '../database/enums/bot-instance-status.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
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
  getPrice: jest.fn(),
});

describe('BotsService', () => {
  let service: BotsService;
  let strategyRepo: ReturnType<typeof mockRepo>;
  let instanceRepo: ReturnType<typeof mockRepo>;
  let ledgerService: ReturnType<typeof mockLedgerService>;
  let priceFeedService: ReturnType<typeof mockPriceFeedService>;

  const mockStrategy: Partial<BotStrategy> = {
    id: 'strat-1',
    name: 'DCA Bot',
    isActive: true,
    allowedAssets: ['BTC', 'ETH'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotsService,
        { provide: getRepositoryToken(BotStrategy), useFactory: mockRepo },
        { provide: getRepositoryToken(BotInstance), useFactory: mockRepo },
        { provide: getRepositoryToken(Trade), useFactory: mockRepo },
        { provide: getRepositoryToken(Asset), useFactory: mockRepo },
        { provide: getRepositoryToken(Account), useFactory: mockRepo },
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
        { provide: getRepositoryToken(LedgerEntry), useFactory: mockRepo },
        { provide: LedgerService, useFactory: mockLedgerService },
        { provide: PriceFeedService, useFactory: mockPriceFeedService },
      ],
    }).compile();

    service = module.get(BotsService);
    strategyRepo = module.get(getRepositoryToken(BotStrategy));
    instanceRepo = module.get(getRepositoryToken(BotInstance));
    ledgerService = module.get(LedgerService);
    priceFeedService = module.get(PriceFeedService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── listStrategies ────────────────────────────────────────────────────────────

  describe('listStrategies', () => {
    it('returns active strategies', async () => {
      strategyRepo.find.mockResolvedValue([mockStrategy]);

      const result = await service.listStrategies();

      expect(result.strategies).toHaveLength(1);
      expect(result.strategies[0]).toEqual(mockStrategy);
    });

    it('returns empty array when no active strategies', async () => {
      strategyRepo.find.mockResolvedValue([]);

      const result = await service.listStrategies();
      expect(result.strategies).toHaveLength(0);
    });
  });

  // ── getStrategy ───────────────────────────────────────────────────────────────

  describe('getStrategy', () => {
    it('returns the strategy when found', async () => {
      strategyRepo.findOne.mockResolvedValue(mockStrategy);

      const result = await service.getStrategy('strat-1');
      expect(result).toEqual(mockStrategy);
    });

    it('throws NotFoundException when strategy not found', async () => {
      strategyRepo.findOne.mockResolvedValue(null);

      await expect(service.getStrategy('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── createInstance ────────────────────────────────────────────────────────────

  describe('createInstance', () => {
    it('throws NotFoundException when strategy not found', async () => {
      strategyRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInstance('user-1', { strategyId: 'bad', allocatedAmount: '1000' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when strategy is inactive', async () => {
      strategyRepo.findOne.mockResolvedValue({ ...mockStrategy, isActive: false });

      await expect(
        service.createInstance('user-1', { strategyId: 'strat-1', allocatedAmount: '1000' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── killAllBots ───────────────────────────────────────────────────────────────

  describe('adminPauseAll', () => {
    it('pauses all running bots and returns the count', async () => {
      instanceRepo.update.mockResolvedValue({ affected: 2 });

      const result = await service.adminPauseAll();

      expect(instanceRepo.update).toHaveBeenCalledWith(
        { status: BotInstanceStatus.ACTIVE },
        { status: BotInstanceStatus.PAUSED },
      );
      expect(result.affected).toBe(2);
    });

    it('returns 0 when no bots are active', async () => {
      instanceRepo.update.mockResolvedValue({ affected: 0 });

      const result = await service.adminPauseAll();
      expect(result.affected).toBe(0);
    });
  });

  // ── runBacktest ───────────────────────────────────────────────────────────────

  describe('runBacktest', () => {
    it('returns simulation results with candles', async () => {
      strategyRepo.findOne.mockResolvedValue(mockStrategy);
      priceFeedService.getPrice.mockResolvedValue(65000);

      const result = await service.runBacktest('strat-1', 'BTC', 1, 1000);

      expect(result.strategyId).toBe('strat-1');
      expect(result.assetSymbol).toBe('BTC');
      expect(result.initialAmount).toBe(1000);
      expect(result.candles.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('pnl');
      expect(result).toHaveProperty('winRate');
    });

    it('throws NotFoundException when strategy not found', async () => {
      strategyRepo.findOne.mockResolvedValue(null);

      await expect(service.runBacktest('bad', 'BTC', 1, 1000)).rejects.toThrow(NotFoundException);
    });
  });
});
