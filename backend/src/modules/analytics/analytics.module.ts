import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

import { AnalyticsController } from './analytics.controller';
import { ApyHistoryService } from './apy-history.service';
import { ProtocolStatsService } from './protocol-stats.service';
import { TvlService } from './tvl.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplyPosition,
      BorrowPosition,
      CollateralPosition,
      MarketSnapshot,
      LiquidationEvent,
      Asset,
      User,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [TvlService, ApyHistoryService, ProtocolStatsService],
  exports: [TvlService, ApyHistoryService, ProtocolStatsService],
})
export class AnalyticsModule {}
