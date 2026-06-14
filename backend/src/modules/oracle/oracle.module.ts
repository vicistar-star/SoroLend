import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { PriceFeed } from '../../database/entities/price-feed.entity';

import { OracleAggregatorService } from './oracle-aggregator.service';
import { OracleScheduler } from './oracle.scheduler';
import { TwapService } from './twap.service';

@Module({
  imports: [TypeOrmModule.forFeature([PriceFeed, Asset])],
  providers: [OracleAggregatorService, TwapService, OracleScheduler],
  exports: [OracleAggregatorService, TwapService],
})
export class OracleModule {}
