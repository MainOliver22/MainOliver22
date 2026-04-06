import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { BotStrategyType } from '../../database/enums/bot-strategy-type.enum';
import { RiskLevel } from '../../database/enums/risk-level.enum';

export class CreateStrategyDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: BotStrategyType })
  @IsEnum(BotStrategyType)
  type!: BotStrategyType;

  @ApiProperty()
  @IsObject()
  parameters!: Record<string, unknown>;

  @ApiProperty({ type: [String] })
  @IsArray()
  allowedAssets!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  maxLeverage?: string;

  @ApiProperty()
  @IsNumberString()
  maxDrawdownPercent!: string;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel!: RiskLevel;
}
