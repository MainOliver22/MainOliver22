import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotStrategy } from '../database/entities/bot-strategy.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { Trade } from '../database/entities/trade.entity';
import { Asset } from '../database/entities/asset.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { LedgerEntry } from '../database/entities/ledger-entry.entity';
import { LedgerModule } from '../ledger/ledger.module';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BotStrategy,
      BotInstance,
      Trade,
      Asset,
      Account,
      Transaction,
      LedgerEntry,
    ]),
    LedgerModule,
  ],
  providers: [BotsService],
  controllers: [BotsController],
  exports: [BotsService],
})
export class BotsModule {}
