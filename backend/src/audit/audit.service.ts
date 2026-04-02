import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

  async log(params: {
    actor?: User;
    actorRole?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const entry = this.auditRepo.create({
      actorId: params.actor?.id ?? null,
      actorRole: params.actorRole ?? params.actor?.role ?? 'SYSTEM',
      action: params.action,
      targetType: params.targetType ?? 'SYSTEM',
      targetId: params.targetId ?? null,
      details: params.details ?? {},
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
    return this.auditRepo.save(entry);
  }

  async search(opts: {
    actorId?: string;
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }) {
    const { actorId, action, targetType, page = 1, limit = 50 } = opts;
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');
    if (actorId) qb.andWhere('log.actorId = :actorId', { actorId });
    if (action) qb.andWhere('log.action ILIKE :action', { action: `%${action}%` });
    if (targetType) qb.andWhere('log.targetType = :targetType', { targetType });
    qb.skip((page - 1) * limit).take(limit);
    const [logs, total] = await qb.getManyAndCount();
    return { logs, total, page, limit };
  }
}
