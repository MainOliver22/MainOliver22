import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsUUID, Matches } from 'class-validator';

export class QuoteExchangeDto {
  @ApiProperty({ description: 'Source asset UUID' })
  @IsUUID()
  fromAssetId!: string;

  @ApiProperty({ description: 'Destination asset UUID' })
  @IsUUID()
  toAssetId!: string;

  @ApiProperty({ description: 'Amount to convert (positive numeric string, e.g. "0.5")' })
  @IsNumberString()
  @Matches(/^(?!0+(\.0+)?$)\d+(\.\d+)?$/, { message: 'fromAmount must be a positive, non-zero numeric string' })
  fromAmount!: string;
}
