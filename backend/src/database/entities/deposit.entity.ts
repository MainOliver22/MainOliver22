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
import { DepositMethod } from '../enums/deposit-method.enum.js';
import { DepositStatus } from '../enums/deposit-status.enum.js';
import { User } from './user.entity.js';
import { Asset } from './asset.entity.js';
import { Transaction } from './transaction.entity.js';

@Entity('deposits')
export class Deposit {
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

  @Column({ type: 'enum', enum: DepositMethod })
  method!: DepositMethod;

  @Column({ type: 'varchar', nullable: true })
  provider!: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalId!: string | null;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status!: DepositStatus;

  @Column({ type: 'varchar', nullable: true })
  fromAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  txHash!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.deposits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @ManyToOne(() => Asset, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetId' })
  asset!: Asset;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction | null;
}
