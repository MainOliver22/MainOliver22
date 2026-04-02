import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsUUID } from 'class-validator';

export class QuoteExchangeDto {
  @ApiProperty({ description: 'Source asset UUID' })
  @IsUUID()
  fromAssetId!: string;

  @ApiProperty({ description: 'Destination asset UUID' })
  @IsUUID()
  toAssetId!: string;

  @ApiProperty({ description: 'Amount to convert (numeric string)' })
  @IsNumberString()
  fromAmount!: string;
}
