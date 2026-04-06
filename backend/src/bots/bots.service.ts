import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotStrategy } from '../database/entities/bot-strategy.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { Trade } from '../database/entities/trade.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerService } from '../ledger/ledger.service';
import { AccountType } from '../database/enums/account-type.enum';
import { TransactionType } from '../database/enums/transaction-type.enum';
import { BotInstanceStatus } from '../database/enums/bot-instance-status.enum';
import { TradeSide } from '../database/enums/trade-side.enum';
import { TradeStatus } from '../database/enums/trade-status.enum';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { PriceFeedService } from '../common/price-feed.service';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(BotStrategy)
    private readonly strategyRepo: Repository<BotStrategy>,
    @InjectRepository(BotInstance)
    private readonly instanceRepo: Repository<BotInstance>,
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
    private readonly ledgerService: LedgerService,
    private readonly priceFeedService: PriceFeedService,
  ) {}

  async listStrategies(): Promise<BotStrategy[]> {
    return this.strategyRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getStrategy(id: string): Promise<BotStrategy> {
    const strategy = await this.strategyRepo.findOne({ where: { id } });
    if (!strategy) throw new NotFoundException(`Strategy ${id} not found`);
    return strategy;
  }

  async createStrategy(
    adminUserId: string,
    dto: CreateStrategyDto,
  ): Promise<BotStrategy> {
    const strategy = this.strategyRepo.create({
      ...dto,
      createdBy: adminUserId,
      isActive: true,
    });
    return this.strategyRepo.save(strategy);
  }

  async createInstance(
    userId: string,
    dto: CreateInstanceDto,
  ): Promise<BotInstance> {
    const strategy = await this.strategyRepo.findOne({
      where: { id: dto.strategyId },
    });
    if (!strategy)
      throw new NotFoundException(`Strategy ${dto.strategyId} not found`);
    if (!strategy.isActive)
      throw new BadRequestException('Strategy is not active');

    // Check balance against first allowed asset (or use USDC as default)
    const allowedAssetSymbols = strategy.allowedAssets;
    let assetId: string | undefined;
    if (allowedAssetSymbols.length > 0) {
      const asset = await this.assetRepo.findOne({
        where: { symbol: allowedAssetSymbols[0] },
      });
      assetId = asset?.id;
    }

    if (assetId) {
      const balance = await this.ledgerService.getBalance(userId, assetId);
      if (parseFloat(balance) < parseFloat(dto.allocatedAmount)) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${balance}`,
        );
      }

      // Lock allocated funds
      const availableAccount = await this.ledgerService.getOrCreateAccount(
        userId,
        assetId,
        AccountType.USER_AVAILABLE,
      );
      const lockedAccount = await this.ledgerService.getOrCreateAccount(
        userId,
        assetId,
        AccountType.USER_LOCKED,
      );
      const lockTx = await this.ledgerService.createTransaction(
        TransactionType.TRANSFER,
        `Bot allocation lock for strategy ${strategy.name}`,
      );
      await this.ledgerService.transfer({
        fromAccountId: availableAccount.id,
        toAccountId: lockedAccount.id,
        amount: dto.allocatedAmount,
        transactionId: lockTx.id,
        description: `Bot instance fund lock`,
      });
      await this.ledgerService.completeTransaction(lockTx.id);
    }

    const instance = this.instanceRepo.create({
      userId,
      strategyId: dto.strategyId,
      allocatedAmount: dto.allocatedAmount,
      currentValue: dto.allocatedAmount,
      pnl: '0',
      pnlPercent: '0',
      parameters: dto.parameters ?? null,
      status: BotInstanceStatus.ACTIVE,
      startedAt: new Date(),
    });

    return this.instanceRepo.save(instance);
  }

  async getUserInstances(userId: string): Promise<BotInstance[]> {
    return this.instanceRepo.find({
      where: { userId },
      relations: ['strategy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInstance(userId: string, instanceId: string): Promise<BotInstance> {
    const instance = await this.instanceRepo.findOne({
      where: { id: instanceId, userId },
      relations: ['strategy'],
    });
    if (!instance)
      throw new NotFoundException(`Bot instance ${instanceId} not found`);
    return instance;
  }

  async pauseInstance(
    userId: string,
    instanceId: string,
  ): Promise<BotInstance> {
    const instance = await this.getInstance(userId, instanceId);
    await this.instanceRepo.update(instanceId, {
      status: BotInstanceStatus.PAUSED,
    });
    instance.status = BotInstanceStatus.PAUSED;
    return instance;
  }

  async stopInstance(userId: string, instanceId: string): Promise<BotInstance> {
    const instance = await this.getInstance(userId, instanceId);

    await this.instanceRepo.update(instanceId, {
      status: BotInstanceStatus.STOPPED,
      stoppedAt: new Date(),
    });

    // Return locked funds to available
    const strategy = await this.strategyRepo.findOne({
      where: { id: instance.strategyId },
    });
    if (strategy && strategy.allowedAssets.length > 0) {
      const asset = await this.assetRepo.findOne({
        where: { symbol: strategy.allowedAssets[0] },
      });
      if (asset) {
        const lockedAccount = await this.ledgerService.getOrCreateAccount(
          userId,
          asset.id,
          AccountType.USER_LOCKED,
        );
        const availableAccount = await this.ledgerService.getOrCreateAccount(
          userId,
          asset.id,
          AccountType.USER_AVAILABLE,
        );
        const lockedBalance = parseFloat(lockedAccount.balance);
        if (lockedBalance > 0) {
          const unlockTx = await this.ledgerService.createTransaction(
            TransactionType.TRANSFER,
            `Bot stop unlock for instance ${instanceId}`,
          );
          await this.ledgerService.transfer({
            fromAccountId: lockedAccount.id,
            toAccountId: availableAccount.id,
            amount: lockedBalance.toFixed(8),
            transactionId: unlockTx.id,
            description: 'Bot instance stopped – funds returned',
          });
          await this.ledgerService.completeTransaction(unlockTx.id);
        }
      }
    }

    instance.status = BotInstanceStatus.STOPPED;
    return instance;
  }

  async getBotTrades(
    instanceId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Trade[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.tradeRepo.findAndCount({
      where: { botInstanceId: instanceId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async simulateTrade(instanceId: string): Promise<Trade> {
    const instance = await this.instanceRepo.findOne({
      where: { id: instanceId },
      relations: ['strategy'],
    });
    if (!instance)
      throw new NotFoundException(`Bot instance ${instanceId} not found`);

    const strategy = instance.strategy;
    const assetSymbol = strategy.allowedAssets[0] ?? 'BTC';
    const asset = await this.assetRepo.findOne({
      where: { symbol: assetSymbol },
    });
    if (!asset) throw new NotFoundException(`Asset ${assetSymbol} not found`);

    const basePrice = await this.priceFeedService.getPrice(assetSymbol);
    const volatility = 0.02;
    const price = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const amount = (parseFloat(instance.allocatedAmount) * 0.1) / price;
    const side = Math.random() > 0.5 ? TradeSide.BUY : TradeSide.SELL;
    const pnlDelta =
      side === TradeSide.SELL
        ? amount * price * 0.01
        : -(amount * price * 0.005);

    const tx = await this.ledgerService.createTransaction(
      TransactionType.BOT_TRADE,
      `Simulated ${side} trade for bot instance ${instanceId}`,
    );

    const trade = this.tradeRepo.create({
      botInstanceId: instanceId,
      transactionId: tx.id,
      assetId: asset.id,
      side,
      amount: amount.toFixed(8),
      price: price.toFixed(2),
      fee: (amount * price * 0.001).toFixed(8),
      status: TradeStatus.EXECUTED,
      executedAt: new Date(),
      signal: { simulated: true, strategy: strategy.type },
    });

    await this.tradeRepo.save(trade);
    await this.ledgerService.completeTransaction(tx.id);

    const newPnl = parseFloat(instance.pnl) + pnlDelta;
    const pnlPercent = (newPnl / parseFloat(instance.allocatedAmount)) * 100;
    await this.instanceRepo.update(instanceId, {
      pnl: newPnl.toFixed(8),
      pnlPercent: pnlPercent.toFixed(4),
      lastTradeAt: new Date(),
    });

    return this.tradeRepo.findOne({
      where: { id: trade.id },
      relations: ['asset'],
    }) as Promise<Trade>;
  }

  async getAllInstances(
    page: number,
    limit: number,
  ): Promise<{
    items: BotInstance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [items, total] = await this.instanceRepo.findAndCount({
      relations: ['strategy', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async adminPauseAll(): Promise<{ affected: number }> {
    const result = await this.instanceRepo.update(
      { status: BotInstanceStatus.ACTIVE },
      { status: BotInstanceStatus.PAUSED },
    );
    return { affected: result.affected ?? 0 };
  }

  async runBacktest(
    strategyId: string,
    assetSymbol: string,
    days: number,
    allocatedAmount: number,
  ): Promise<{
    strategyId: string;
    assetSymbol: string;
    days: number;
    initialAmount: number;
    finalAmount: number;
    pnl: number;
    pnlPercent: number;
    tradeCount: number;
    winRate: number;
    candles: Array<{
      timestamp: string;
      price: number;
      action: string;
      portfolioValue: number;
    }>;
  }> {
    const strategy = await this.strategyRepo.findOne({
      where: { id: strategyId },
    });
    if (!strategy)
      throw new NotFoundException(`Strategy ${strategyId} not found`);

    const startPrice = await this.priceFeedService.getPrice(assetSymbol);
    const totalCandles = days * 24;
    const startTime = Date.now() - totalCandles * 3_600_000;

    let price = startPrice;
    let cashUsd = allocatedAmount;
    let assetHeld = 0;
    let tradeCount = 0;
    let wins = 0;
    let lastBuyPrice = 0;

    const candles: Array<{
      timestamp: string;
      price: number;
      action: string;
      portfolioValue: number;
    }> = [];

    for (let i = 0; i < totalCandles; i++) {
      const prevPrice = price;
      const move = (Math.random() - 0.5) * 2 * 0.02; // ±2%
      price = price * (1 + move);

      let action = 'HOLD';

      // Simple MA crossover: buy when price rises, sell when price falls
      if (price > prevPrice && cashUsd > 0) {
        // BUY: spend all cash
        assetHeld = cashUsd / price;
        lastBuyPrice = price;
        cashUsd = 0;
        action = 'BUY';
        tradeCount++;
      } else if (price < prevPrice && assetHeld > 0) {
        // SELL: liquidate all assets
        const proceeds = assetHeld * price;
        if (price > lastBuyPrice) wins++;
        cashUsd = proceeds;
        assetHeld = 0;
        action = 'SELL';
        tradeCount++;
      }

      const portfolioValue = cashUsd + assetHeld * price;
      candles.push({
        timestamp: new Date(startTime + i * 3_600_000).toISOString(),
        price: parseFloat(price.toFixed(4)),
        action,
        portfolioValue: parseFloat(portfolioValue.toFixed(2)),
      });
    }

    // Liquidate any remaining position at final price
    const finalAmount = cashUsd + assetHeld * price;
    const pnl = finalAmount - allocatedAmount;
    const pnlPercent = (pnl / allocatedAmount) * 100;
    const winRate = tradeCount > 0 ? (wins / (tradeCount / 2)) * 100 : 0;

    return {
      strategyId,
      assetSymbol,
      days,
      initialAmount: allocatedAmount,
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2)),
      tradeCount,
      winRate: parseFloat(winRate.toFixed(2)),
      candles,
    };
  }
}
