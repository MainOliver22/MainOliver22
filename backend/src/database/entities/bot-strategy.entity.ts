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
import { BotStrategyType } from '../enums/bot-strategy-type.enum.js';
import { RiskLevel } from '../enums/risk-level.enum.js';
import { User } from './user.entity.js';
import { BotInstance } from './bot-instance.entity.js';

@Entity('bot_strategies')
export class BotStrategy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: BotStrategyType })
  type!: BotStrategyType;

  @Column({ type: 'jsonb', default: {} })
  parameters!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  allowedAssets!: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  maxLeverage!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxDrawdownPercent!: string;

  @Column({ type: 'enum', enum: RiskLevel })
  riskLevel!: RiskLevel;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @OneToMany(() => BotInstance, (instance) => instance.strategy)
  instances!: BotInstance[];
}
