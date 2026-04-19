import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Deposit } from '../database/entities/deposit.entity';
import { Withdrawal } from '../database/entities/withdrawal.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { KycCase } from '../database/entities/kyc-case.entity';
import { Account } from '../database/entities/account.entity';
import { FeeConfig } from '../database/entities/fee-config.entity';
import { RiskRule } from '../database/entities/risk-rule.entity';
import { AuditModule } from '../audit/audit.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Deposit,
      Withdrawal,
      BotInstance,
      KycCase,
      Account,
      FeeConfig,
      RiskRule,
    ]),
    AuditModule,
  ],
  providers: [AdminService, SettingsService],
  controllers: [AdminController, SettingsController],
  exports: [AdminService, SettingsService],
})
export class AdminModule {}
