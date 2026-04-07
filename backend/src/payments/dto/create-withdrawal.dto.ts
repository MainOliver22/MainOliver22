import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { WithdrawalMethod } from '../../database/enums/withdrawal-method.enum';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Asset UUID' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Amount to withdraw (numeric string)' })
  @IsNumberString()
  amount!: string;

  @ApiProperty({ enum: WithdrawalMethod })
  @IsEnum(WithdrawalMethod)
  method!: WithdrawalMethod;

  @ApiPropertyOptional({
    description: 'Destination address for crypto withdrawals',
  })
  @IsOptional()
  @IsString()
  toAddress?: string;

  @ApiPropertyOptional({
    description: 'Encrypted bank details for bank transfers',
  })
  @IsOptional()
  @IsObject()
  bankDetails?: Record<string, unknown>;
}
