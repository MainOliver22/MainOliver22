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
import { FeeType } from '../enums/fee-type.enum.js';
import { Asset } from './asset.entity.js';

@Entity('fee_configs')
export class FeeConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: FeeType })
  type!: FeeType;

  @Column({ type: 'uuid', nullable: true })
  assetId!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  value!: string;

  @Column({ type: 'boolean', default: true })
  isPercentage!: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  minAmount!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  maxAmount!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assetId' })
  asset!: Asset | null;
}
