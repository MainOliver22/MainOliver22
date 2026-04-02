import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TradeSide } from '../enums/trade-side.enum.js';
import { TradeStatus } from '../enums/trade-status.enum.js';
import { BotInstance } from './bot-instance.entity.js';
import { Transaction } from './transaction.entity.js';
import { Asset } from './asset.entity.js';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  botInstanceId!: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'uuid' })
  assetId!: string;

  @Column({ type: 'enum', enum: TradeSide })
  side!: TradeSide;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  fee!: string;

  @Column({ type: 'enum', enum: TradeStatus, default: TradeStatus.PENDING })
  status!: TradeStatus;

  @Column({ type: 'jsonb', nullable: true })
  signal!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  externalOrderId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Index()
  @ManyToOne(() => BotInstance, (bot) => bot.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'botInstanceId' })
  botInstance!: BotInstance;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction | null;

  @ManyToOne(() => Asset, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetId' })
  asset!: Asset;
}
