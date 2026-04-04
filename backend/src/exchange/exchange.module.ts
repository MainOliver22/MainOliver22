import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeOrder } from '../database/entities/exchange-order.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerModule } from '../ledger/ledger.module';
import { CommonModule } from '../common/common.module';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeOrder, Asset, Account, Transaction, LedgerEntry]),
    LedgerModule,
    CommonModule,
  ],
  providers: [ExchangeService],
  controllers: [ExchangeController],
  exports: [ExchangeService],
})
export class ExchangeModule {}
