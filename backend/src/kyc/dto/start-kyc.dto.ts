import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KycLevel } from '../../database/enums/kyc-level.enum';

export class StartKycDto {
  @ApiProperty({ enum: KycLevel })
  @IsEnum(KycLevel)
  level!: KycLevel;
}
