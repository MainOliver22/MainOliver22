import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KycModule } from './kyc/kyc.module';
import { WalletsModule } from './wallets/wallets.module';
import { LedgerModule } from './ledger/ledger.module';
import { AssetsModule } from './assets/assets.module';
import { PaymentsModule } from './payments/payments.module';
import { ExchangeModule } from './exchange/exchange.module';
import { BotsModule } from './bots/bots.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import all entities
import {
  User,
  RefreshToken,
  KycCase,
  KycDocument,
  Wallet,
  Asset,
  Account,
  LedgerEntry,
  Transaction,
  Deposit,
  Withdrawal,
  ExchangeOrder,
  BotStrategy,
  BotInstance,
  Trade,
  AuditLog,
  Notification as NotificationEntity,
  SupportTicket,
  RiskRule,
  FeeConfig,
} from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/investplatform',
        ),
        entities: [
          User,
          RefreshToken,
          KycCase,
          KycDocument,
          Wallet,
          Asset,
          Account,
          LedgerEntry,
          Transaction,
          Deposit,
          Withdrawal,
          ExchangeOrder,
          BotStrategy,
          BotInstance,
          Trade,
          AuditLog,
          NotificationEntity,
          SupportTicket,
          RiskRule,
          FeeConfig,
        ],
        synchronize:
          config.get<string>('NODE_ENV', 'development') === 'development',
        logging:
          config.get<string>('NODE_ENV', 'development') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    KycModule,
    WalletsModule,
    LedgerModule,
    AssetsModule,
    PaymentsModule,
    ExchangeModule,
    BotsModule,
    AdminModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
