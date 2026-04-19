import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeConfig } from '../database/entities/fee-config.entity';
import { RiskRule } from '../database/entities/risk-rule.entity';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(FeeConfig)
    private readonly feeConfigRepo: Repository<FeeConfig>,
    @InjectRepository(RiskRule)
    private readonly riskRuleRepo: Repository<RiskRule>,
  ) {}

  // ── Fee Configs ───────────────────────────────────────────────────────────────

  async listFeeConfigs(): Promise<FeeConfig[]> {
    return this.feeConfigRepo.find({
      relations: ['asset'],
      order: { type: 'ASC', createdAt: 'ASC' },
    });
  }

  async getFeeConfig(id: string): Promise<FeeConfig> {
    const config = await this.feeConfigRepo.findOne({ where: { id }, relations: ['asset'] });
    if (!config) throw new NotFoundException(`FeeConfig ${id} not found`);
    return config;
  }

  async createFeeConfig(dto: CreateFeeConfigDto): Promise<FeeConfig> {
    const fee = this.feeConfigRepo.create({
      name: dto.name,
      type: dto.type,
      assetId: dto.assetId ?? null,
      value: String(dto.value),
      isPercentage: dto.isPercentage ?? true,
      minAmount: dto.minAmount !== undefined ? String(dto.minAmount) : null,
      maxAmount: dto.maxAmount !== undefined ? String(dto.maxAmount) : null,
      isActive: dto.isActive ?? true,
    });
    return this.feeConfigRepo.save(fee);
  }

  async updateFeeConfig(id: string, dto: Partial<CreateFeeConfigDto>): Promise<FeeConfig> {
    const existing = await this.feeConfigRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`FeeConfig ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates['name'] = dto.name;
    if (dto.type !== undefined) updates['type'] = dto.type;
    if (dto.assetId !== undefined) updates['assetId'] = dto.assetId ?? null;
    if (dto.value !== undefined) updates['value'] = String(dto.value);
    if (dto.isPercentage !== undefined) updates['isPercentage'] = dto.isPercentage;
    if (dto.minAmount !== undefined) updates['minAmount'] = String(dto.minAmount);
    if (dto.maxAmount !== undefined) updates['maxAmount'] = String(dto.maxAmount);
    if (dto.isActive !== undefined) updates['isActive'] = dto.isActive;

    await this.feeConfigRepo.update(id, updates as never);
    return this.getFeeConfig(id);
  }

  async deleteFeeConfig(id: string): Promise<{ message: string }> {
    const existing = await this.feeConfigRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`FeeConfig ${id} not found`);
    await this.feeConfigRepo.delete(id);
    return { message: `FeeConfig ${id} deleted` };
  }

  // ── Risk Rules ────────────────────────────────────────────────────────────────

  async listRiskRules(): Promise<RiskRule[]> {
    return this.riskRuleRepo.find({
      order: { type: 'ASC', createdAt: 'ASC' },
    });
  }

  async getRiskRule(id: string): Promise<RiskRule> {
    const rule = await this.riskRuleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`RiskRule ${id} not found`);
    return rule;
  }

  async createRiskRule(adminUserId: string, dto: CreateRiskRuleDto): Promise<RiskRule> {
    const rule = this.riskRuleRepo.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      parameters: dto.parameters,
      scope: dto.scope,
      isActive: dto.isActive ?? true,
      createdBy: adminUserId,
    });
    return this.riskRuleRepo.save(rule);
  }

  async updateRiskRule(id: string, dto: Partial<CreateRiskRuleDto>): Promise<RiskRule> {
    const existing = await this.riskRuleRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`RiskRule ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates['name'] = dto.name;
    if (dto.description !== undefined) updates['description'] = dto.description;
    if (dto.type !== undefined) updates['type'] = dto.type;
    if (dto.parameters !== undefined) updates['parameters'] = dto.parameters;
    if (dto.scope !== undefined) updates['scope'] = dto.scope;
    if (dto.isActive !== undefined) updates['isActive'] = dto.isActive;

    await this.riskRuleRepo.update(id, updates as never);
    return this.getRiskRule(id);
  }

  async deleteRiskRule(id: string): Promise<{ message: string }> {
    const existing = await this.riskRuleRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`RiskRule ${id} not found`);
    await this.riskRuleRepo.delete(id);
    return { message: `RiskRule ${id} deleted` };
  }
}
