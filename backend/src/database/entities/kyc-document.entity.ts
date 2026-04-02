import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DocumentType } from '../enums/document-type.enum.js';
import { DocumentStatus } from '../enums/document-status.enum.js';
import { KycCase } from './kyc-case.entity.js';

@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  kycCaseId!: string;

  @Column({ type: 'enum', enum: DocumentType })
  documentType!: DocumentType;

  @Column({ type: 'varchar', comment: 'Encrypted file URL' })
  fileUrl!: string;

  @Column({ type: 'varchar' })
  fileName!: string;

  @Column({ type: 'varchar' })
  mimeType!: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Index()
  @ManyToOne(() => KycCase, (kycCase) => kycCase.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kycCaseId' })
  kycCase!: KycCase;
}
