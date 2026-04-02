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
  Unique,
} from 'typeorm';
import { AccountType } from '../enums/account-type.enum.js';
import { User } from './user.entity.js';
import { Asset } from './asset.entity.js';
import { LedgerEntry } from './ledger-entry.entity.js';

@Entity('accounts')
@Unique(['userId', 'assetId', 'type'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid' })
  assetId!: string;

  @Column({ type: 'enum', enum: AccountType })
  type!: AccountType;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.accounts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Index()
  @ManyToOne(() => Asset, (asset) => asset.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetId' })
  asset!: Asset;

  @OneToMany(() => LedgerEntry, (entry) => entry.account)
  ledgerEntries!: LedgerEntry[];
}
