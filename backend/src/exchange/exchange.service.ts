import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ExchangeOrder } from '../database/entities/exchange-order.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerService } from '../ledger/ledger.service';
import { AccountType } from '../database/enums/account-type.enum';
import { TransactionType } from '../database/enums/transaction-type.enum';
import { ExchangeOrderStatus } from '../database/enums/exchange-order-status.enum';
import { QuoteExchangeDto } from './dto/quote-exchange.dto';
import { ExecuteExchangeDto } from './dto/execute-exchange.dto';
import { getMockRate } from '../common/mock-prices';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(ExchangeOrder)
    private readonly orderRepo: Repository<ExchangeOrder>,
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

  async getQuote(userId: string, dto: QuoteExchangeDto): Promise<ExchangeOrder> {
    const [fromAsset, toAsset] = await Promise.all([
      this.assetRepo.findOne({ where: { id: dto.fromAssetId } }),
      this.assetRepo.findOne({ where: { id: dto.toAssetId } }),
    ]);
    if (!fromAsset) throw new NotFoundException(`Asset ${dto.fromAssetId} not found`);
    if (!toAsset) throw new NotFoundException(`Asset ${dto.toAssetId} not found`);

    const baseRate = getMockRate(fromAsset.symbol, toAsset.symbol);
    const spreadPct = 0.005; // 0.5%
    const feePct = 0.001;    // 0.1%

    const fromAmount = parseFloat(dto.fromAmount);
    const spreadAmount = fromAmount * spreadPct;
    const feeAmount = fromAmount * feePct;
    const effectiveFrom = fromAmount - spreadAmount - feeAmount;
    const toAmount = effectiveFrom * baseRate;

    const quoteExpiresAt = new Date(Date.now() + 30_000); // 30 seconds

    const order = this.orderRepo.create({
      userId,
      fromAssetId: dto.fromAssetId,
      toAssetId: dto.toAssetId,
      fromAmount: dto.fromAmount,
      toAmount: toAmount.toFixed(8),
      rate: baseRate.toFixed(8),
      spread: (spreadAmount).toFixed(8),
      fee: (feeAmount).toFixed(8),
      status: ExchangeOrderStatus.QUOTED,
      quoteExpiresAt,
      idempotencyKey: uuid(),
    });

    await this.orderRepo.save(order);
    return this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['fromAsset', 'toAsset'],
    }) as Promise<ExchangeOrder>;
  }

  async executeExchange(userId: string, dto: ExecuteExchangeDto): Promise<ExchangeOrder> {
    const order = await this.orderRepo.findOne({
      where: { id: dto.quoteId, userId },
      relations: ['fromAsset', 'toAsset'],
    });
    if (!order) throw new NotFoundException(`Quote ${dto.quoteId} not found`);
    if (order.status !== ExchangeOrderStatus.QUOTED) {
      throw new BadRequestException(`Quote is not in QUOTED state (current: ${order.status})`);
    }
    if (order.quoteExpiresAt && order.quoteExpiresAt < new Date()) {
      await this.orderRepo.update(order.id, { status: ExchangeOrderStatus.EXPIRED });
      throw new BadRequestException('Quote has expired. Please request a new quote.');
    }

    const balance = await this.ledgerService.getBalance(userId, order.fromAssetId);
    if (parseFloat(balance) < parseFloat(order.fromAmount)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${balance} ${order.fromAsset.symbol}`,
      );
    }

    const tx = await this.ledgerService.createTransaction(
      TransactionType.EXCHANGE,
      `Exchange ${order.fromAmount} ${order.fromAsset.symbol} → ${order.toAmount} ${order.toAsset.symbol}`,
      { orderId: order.id },
      dto.idempotencyKey,
    );

    await this.orderRepo.update(order.id, { transactionId: tx.id });

    // User fromAsset account → system exchange account
    const userFromAccount = await this.ledgerService.getOrCreateAccount(
      userId,
      order.fromAssetId,
      AccountType.USER_AVAILABLE,
    );
    const systemExchangeFromAccount = await this.ledgerService.getOrCreateAccount(
      null,
      order.fromAssetId,
      AccountType.SYSTEM_EXCHANGE,
    );

    await this.ledgerService.transfer({
      fromAccountId: userFromAccount.id,
      toAccountId: systemExchangeFromAccount.id,
      amount: order.fromAmount,
      transactionId: tx.id,
      description: `Exchange debit ${order.fromAmount} ${order.fromAsset.symbol}`,
    });

    // System exchange account → user toAsset account
    const systemExchangeToAccount = await this.ledgerService.getOrCreateAccount(
      null,
      order.toAssetId,
      AccountType.SYSTEM_EXCHANGE,
    );
    const sysToBalance = parseFloat(systemExchangeToAccount.balance);
    const toAmount = parseFloat(order.toAmount);
    if (sysToBalance < toAmount) {
      await this.accountRepo.update(systemExchangeToAccount.id, {
        balance: (sysToBalance + toAmount * 10).toFixed(8),
      });
    }

    const userToAccount = await this.ledgerService.getOrCreateAccount(
      userId,
      order.toAssetId,
      AccountType.USER_AVAILABLE,
    );

    const creditTx = await this.ledgerService.createTransaction(
      TransactionType.EXCHANGE,
      `Exchange credit ${order.toAmount} ${order.toAsset.symbol}`,
      { orderId: order.id },
    );

    await this.ledgerService.transfer({
      fromAccountId: systemExchangeToAccount.id,
      toAccountId: userToAccount.id,
      amount: order.toAmount,
      transactionId: creditTx.id,
      description: `Exchange credit ${order.toAmount} ${order.toAsset.symbol}`,
    });

    await this.ledgerService.completeTransaction(tx.id);
    await this.ledgerService.completeTransaction(creditTx.id);

    await this.orderRepo.update(order.id, {
      status: ExchangeOrderStatus.FILLED,
      executedAt: new Date(),
    });

    return this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['fromAsset', 'toAsset'],
    }) as Promise<ExchangeOrder>;
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ExchangeOrder[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: ['fromAsset', 'toAsset'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getAllOrders(
    page: number,
    limit: number,
  ): Promise<{ items: ExchangeOrder[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.orderRepo.findAndCount({
      relations: ['fromAsset', 'toAsset', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }
}
