import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { DepositMethod } from '../../database/enums/deposit-method.enum';

export class CreateDepositDto {
  @ApiProperty({ description: 'Asset UUID' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Amount to deposit (numeric string)' })
  @IsNumberString()
  amount!: string;

  @ApiProperty({ enum: DepositMethod })
  @IsEnum(DepositMethod)
  method!: DepositMethod;

  @ApiPropertyOptional({ description: 'Extra metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
