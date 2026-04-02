import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TransactionType } from '../enums/transaction-type.enum.js';
import { TransactionStatus } from '../enums/transaction-status.enum.js';
import { LedgerEntry } from './ledger-entry.entity.js';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey!: string | null;

  @Column({ type: 'varchar', nullable: true })
  referenceType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  referenceId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction)
  ledgerEntries!: LedgerEntry[];
}
