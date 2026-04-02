import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntryType } from '../enums/entry-type.enum.js';
import { Transaction } from './transaction.entity.js';
import { Account } from './account.entity.js';

@Entity('ledger_entries')
@Index(['accountId', 'createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  transactionId!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  balanceAfter!: string;

  @Column({ type: 'enum', enum: EntryType })
  entryType!: EntryType;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Transaction, (tx) => tx.ledgerEntries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;

  @ManyToOne(() => Account, (account) => account.ledgerEntries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account!: Account;
}
