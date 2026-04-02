import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycCase } from '../database/entities/kyc-case.entity';
import { KycDocument } from '../database/entities/kyc-document.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KycCase, KycDocument])],
  providers: [KycService],
  controllers: [KycController],
  exports: [KycService],
})
export class KycModule {}
