import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsObject, IsOptional, IsUUID, Matches } from 'class-validator';
import { DepositMethod } from '../../database/enums/deposit-method.enum';

export class CreateDepositDto {
  @ApiProperty({ description: 'Asset UUID' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Amount to deposit (positive numeric string, e.g. "100.50")' })
  @IsNumberString()
  @Matches(/^(?!0+(\.0+)?$)\d+(\.\d+)?$/, { message: 'amount must be a positive, non-zero numeric string' })
  amount!: string;

  @ApiProperty({ enum: DepositMethod })
  @IsEnum(DepositMethod)
  method!: DepositMethod;

  @ApiPropertyOptional({ description: 'Extra metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
