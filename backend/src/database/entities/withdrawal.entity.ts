import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WithdrawalMethod } from '../enums/withdrawal-method.enum.js';
import { WithdrawalStatus } from '../enums/withdrawal-status.enum.js';
import { User } from './user.entity.js';
import { Asset } from './asset.entity.js';
import { Transaction } from './transaction.entity.js';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  assetId!: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  fee!: string;

  @Column({ type: 'enum', enum: WithdrawalMethod })
  method!: WithdrawalMethod;

  @Column({ type: 'varchar', nullable: true })
  toAddress!: string | null;

  @Column({ type: 'jsonb', nullable: true, comment: 'Encrypted bank details' })
  bankDetails!: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING_APPROVAL })
  status!: WithdrawalStatus;

  @Column({ type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'boolean', default: false })
  complianceChecked!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.withdrawals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @ManyToOne(() => Asset, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetId' })
  asset!: Asset;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver!: User | null;
}
