import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumberString,
  IsObject,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateInstanceDto {
  @ApiProperty({ description: 'BotStrategy UUID' })
  @IsUUID()
  strategyId!: string;

  @ApiProperty({
    description: 'Amount to allocate (positive numeric string, e.g. "100.00")',
  })
  @IsNumberString()
  @Matches(/^(?!0+(\.0+)?$)\d+(\.\d+)?$/, {
    message: 'allocatedAmount must be a positive, non-zero numeric string',
  })
  allocatedAmount!: string;

  @ApiPropertyOptional({ description: 'Override strategy parameters' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}
