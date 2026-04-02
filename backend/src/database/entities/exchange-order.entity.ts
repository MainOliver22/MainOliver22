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
import { ExchangeOrderStatus } from '../enums/exchange-order-status.enum.js';
import { User } from './user.entity.js';
import { Asset } from './asset.entity.js';
import { Transaction } from './transaction.entity.js';

@Entity('exchange_orders')
export class ExchangeOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'uuid' })
  fromAssetId!: string;

  @Column({ type: 'uuid' })
  toAssetId!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  fromAmount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  toAmount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  spread!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  fee!: string;

  @Column({ type: 'enum', enum: ExchangeOrderStatus, default: ExchangeOrderStatus.QUOTED })
  status!: ExchangeOrderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  quoteExpiresAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt!: Date | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.exchangeOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction | null;

  @ManyToOne(() => Asset, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromAssetId' })
  fromAsset!: Asset;

  @ManyToOne(() => Asset, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toAssetId' })
  toAsset!: Asset;
}
