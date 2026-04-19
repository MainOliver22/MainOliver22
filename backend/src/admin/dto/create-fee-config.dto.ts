import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeeType } from '../../database/enums/fee-type.enum';

export class CreateFeeConfigDto {
  @ApiProperty({ example: 'Exchange spread fee' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: FeeType })
  @IsEnum(FeeType)
  type!: FeeType;

  @ApiPropertyOptional({ description: 'Apply fee to specific asset only; null = global' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiProperty({ example: 0.5, description: 'Fee value (0.5 = 0.5% if isPercentage=true)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ default: true, description: 'true = percentage, false = flat amount' })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Minimum transaction amount to apply fee' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Maximum fee amount (for percentage fees)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
