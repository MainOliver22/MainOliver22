import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskRuleType } from '../../database/enums/risk-rule-type.enum';
import { RiskRuleScope } from '../../database/enums/risk-rule-scope.enum';

export class CreateRiskRuleDto {
  @ApiProperty({ example: 'Max daily withdrawal USD 50k' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Limits daily withdrawal to $50,000 per user' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: RiskRuleType })
  @IsEnum(RiskRuleType)
  type!: RiskRuleType;

  @ApiProperty({ example: { maxAmount: 50000, currency: 'USD', windowHours: 24 } })
  @IsObject()
  parameters!: Record<string, unknown>;

  @ApiProperty({ enum: RiskRuleScope })
  @IsEnum(RiskRuleScope)
  scope!: RiskRuleScope;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
