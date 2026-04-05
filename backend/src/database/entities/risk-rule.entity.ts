import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RiskRuleType } from '../enums/risk-rule-type.enum.js';
import { RiskRuleScope } from '../enums/risk-rule-scope.enum.js';
import { User } from './user.entity.js';

@Entity('risk_rules')
export class RiskRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: RiskRuleType })
  type!: RiskRuleType;

  @Column({ type: 'jsonb' })
  parameters!: Record<string, unknown>;

  @Column({ type: 'enum', enum: RiskRuleScope })
  scope!: RiskRuleScope;

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
}
