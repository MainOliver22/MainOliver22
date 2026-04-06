import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Deposit } from '../database/entities/deposit.entity';
import { Withdrawal } from '../database/entities/withdrawal.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { KycCase } from '../database/entities/kyc-case.entity';
import { Account } from '../database/entities/account.entity';
import { AuditModule } from '../audit/audit.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Deposit,
      Withdrawal,
      BotInstance,
      KycCase,
      Account,
    ]),
    AuditModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
