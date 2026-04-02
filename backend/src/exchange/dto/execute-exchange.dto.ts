import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ExecuteExchangeDto {
  @ApiProperty({ description: 'The ExchangeOrder UUID returned from the quote step' })
  @IsUUID()
  quoteId!: string;

  @ApiPropertyOptional({ description: 'Optional idempotency key' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
