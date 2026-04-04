import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PriceFeedService } from './price-feed.service';
import { AmlService } from './aml.service';

@Module({
  imports: [ConfigModule],
  providers: [PriceFeedService, AmlService],
  exports: [PriceFeedService, AmlService],
})
export class CommonModule {}
