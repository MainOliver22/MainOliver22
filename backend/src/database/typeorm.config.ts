import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
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
  Notification,
  SupportTicket,
  RiskRule,
  FeeConfig,
} from './entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env['DATABASE_URL'] ??
    'postgresql://postgres:postgres@localhost:5432/investplatform',
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
    Notification,
    SupportTicket,
    RiskRule,
    FeeConfig,
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: false,
});
