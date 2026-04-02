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
import { KycStatus } from '../enums/kyc-status.enum.js';
import { KycLevel } from '../enums/kyc-level.enum.js';
import { User } from './user.entity.js';
import { KycDocument } from './kyc-document.entity.js';

@Entity('kyc_cases')
export class KycCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar' })
  provider!: string;

  @Column({ type: 'varchar', nullable: true })
  externalId!: string | null;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  status!: KycStatus;

  @Column({ type: 'enum', enum: KycLevel, default: KycLevel.BASIC })
  level!: KycLevel;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.kycCases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer!: User | null;

  @OneToMany(() => KycDocument, (doc) => doc.kycCase)
  documents!: KycDocument[];
}
