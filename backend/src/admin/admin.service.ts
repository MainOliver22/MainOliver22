import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Deposit } from '../database/entities/deposit.entity';
import { Withdrawal } from '../database/entities/withdrawal.entity';
import { BotInstance } from '../database/entities/bot-instance.entity';
import { KycCase } from '../database/entities/kyc-case.entity';
import { Account } from '../database/entities/account.entity';
import { AuditService } from '../audit/audit.service';
import { UserStatus } from '../database/enums/user-status.enum';
import { UserRole } from '../database/enums/user-role.enum';
import { BotInstanceStatus } from '../database/enums/bot-instance-status.enum';
import { KycStatus } from '../database/enums/kyc-status.enum';
import { DepositStatus } from '../database/enums/deposit-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(BotInstance)
    private readonly botInstanceRepo: Repository<BotInstance>,
    @InjectRepository(KycCase)
    private readonly kycCaseRepo: Repository<KycCase>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly auditService: AuditService,
  ) {}

  async getUsers(
    page: number,
    limit: number,
    status?: UserStatus,
    role?: UserRole,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');
    if (status) qb.andWhere('user.status = :status', { status });
    if (role) qb.andWhere('user.role = :role', { role });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getUserDetail(userId: string): Promise<{
    user: User;
    balances: Account[];
    kycStatus: string;
    botInstancesCount: number;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const [balances, kycCase, botInstancesCount] = await Promise.all([
      this.accountRepo.find({ where: { userId }, relations: ['asset'] }),
      this.kycCaseRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.botInstanceRepo.count({ where: { userId } }),
    ]);

    return {
      user,
      balances,
      kycStatus: kycCase?.status ?? KycStatus.NOT_STARTED,
      botInstancesCount,
    };
  }

  async freezeAccount(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    await this.userRepo.update(userId, { status: UserStatus.FROZEN });
    user.status = UserStatus.FROZEN;
    return user;
  }

  async unfreezeAccount(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    await this.userRepo.update(userId, { status: UserStatus.ACTIVE });
    user.status = UserStatus.ACTIVE;
    return user;
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingKyc: number;
    totalDepositsToday: number;
    totalWithdrawalsToday: number;
    activeBots: number;
    totalAum: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingKyc,
      totalDepositsToday,
      totalWithdrawalsToday,
      activeBots,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { status: UserStatus.ACTIVE } }),
      this.kycCaseRepo.count({ where: { status: KycStatus.IN_REVIEW } }),
      this.depositRepo
        .createQueryBuilder('d')
        .where('d.createdAt >= :today', { today })
        .andWhere('d.status = :status', { status: DepositStatus.CONFIRMED })
        .getCount(),
      this.withdrawalRepo
        .createQueryBuilder('w')
        .where('w.createdAt >= :today', { today })
        .getCount(),
      this.botInstanceRepo.count({
        where: { status: BotInstanceStatus.ACTIVE },
      }),
    ]);

    // Sum all user available account balances (rough AUM)
    const aumResult = await this.accountRepo
      .createQueryBuilder('account')
      .select('SUM(CAST(account.balance AS DECIMAL))', 'totalAum')
      .where('account.userId IS NOT NULL')
      .getRawOne<{ totalAum: string }>();

    return {
      totalUsers,
      activeUsers,
      pendingKyc,
      totalDepositsToday,
      totalWithdrawalsToday,
      activeBots,
      totalAum: aumResult?.totalAum ?? '0',
    };
  }

  async getAuditLogs(
    page: number,
    limit: number,
    actorId?: string,
    action?: string,
    targetType?: string,
  ) {
    return this.auditService.search({
      actorId,
      action,
      targetType,
      page,
      limit,
    });
  }

  getSystemHealth(): { status: string; timestamp: string; version: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
