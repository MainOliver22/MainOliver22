import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '../../database/enums/ticket-priority.enum';

export class CreateTicketDto {
  @ApiProperty({ example: 'Deposit not credited after 24 hours' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: 'I deposited 100 USD via bank transfer on 2024-01-01...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'PAYMENTS', description: 'Category (PAYMENTS, KYC, BOTS, EXCHANGE, OTHER)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category!: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
