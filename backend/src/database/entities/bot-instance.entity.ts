import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BotInstanceStatus } from '../enums/bot-instance-status.enum.js';
import { User } from './user.entity.js';
import { BotStrategy } from './bot-strategy.entity.js';
import { Trade } from './trade.entity.js';

@Entity('bot_instances')
export class BotInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  strategyId!: string;

  @Column({ type: 'enum', enum: BotInstanceStatus, default: BotInstanceStatus.ACTIVE })
  status!: BotInstanceStatus;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  allocatedAmount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  currentValue!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  pnl!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  pnlPercent!: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastTradeAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  stoppedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.botInstances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @ManyToOne(() => BotStrategy, (strategy) => strategy.instances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'strategyId' })
  strategy!: BotStrategy;

  @OneToMany(() => Trade, (trade) => trade.botInstance)
  trades!: Trade[];
}
