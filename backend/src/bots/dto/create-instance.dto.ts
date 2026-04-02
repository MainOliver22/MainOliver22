import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateInstanceDto {
  @ApiProperty({ description: 'BotStrategy UUID' })
  @IsUUID()
  strategyId!: string;

  @ApiProperty({ description: 'Amount to allocate (numeric string)' })
  @IsNumberString()
  allocatedAmount!: string;

  @ApiPropertyOptional({ description: 'Override strategy parameters' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}
