import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum.js';
import { UserStatus } from '../enums/user-status.enum.js';
import { RefreshToken } from './session.entity.js';
import { KycCase } from './kyc-case.entity.js';
import { Wallet } from './wallet.entity.js';
import { Account } from './account.entity.js';
import { Deposit } from './deposit.entity.js';
import { Withdrawal } from './withdrawal.entity.js';
import { ExchangeOrder } from './exchange-order.entity.js';
import { BotInstance } from './bot-instance.entity.js';
import { Notification } from './notification.entity.js';
import { SupportTicket } from './support-ticket.entity.js';
import { AuditLog } from './audit-log.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret!: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => KycCase, (kyc) => kyc.user)
  kycCases!: KycCase[];

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets!: Wallet[];

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @OneToMany(() => Deposit, (deposit) => deposit.user)
  deposits!: Deposit[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  withdrawals!: Withdrawal[];

  @OneToMany(() => ExchangeOrder, (order) => order.user)
  exchangeOrders!: ExchangeOrder[];

  @OneToMany(() => BotInstance, (bot) => bot.user)
  botInstances!: BotInstance[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  @OneToMany(() => SupportTicket, (t) => t.user)
  supportTickets!: SupportTicket[];

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs!: AuditLog[];
}
