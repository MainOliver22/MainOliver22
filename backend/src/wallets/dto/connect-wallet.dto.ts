import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectWalletDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b8D4C9B7d9bCfd3e12' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 'ethereum' })
  @IsString()
  chain!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  label?: string;
}
