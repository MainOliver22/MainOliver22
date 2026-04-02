import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AssetType } from '../enums/asset-type.enum.js';
import { Account } from './account.entity.js';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  symbol!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: AssetType })
  type!: AssetType;

  @Column({ type: 'varchar', nullable: true })
  chain!: string | null;

  @Column({ type: 'varchar', nullable: true })
  contractAddress!: string | null;

  @Column({ type: 'int', default: 18 })
  decimals!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  iconUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Account, (account) => account.asset)
  accounts!: Account[];
}
