import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

import { EventProcessorService } from './event-processor.service';
import { IndexerGateway } from './indexer.gateway';
import { StellarIndexerService } from './stellar-indexer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplyPosition,
      BorrowPosition,
      CollateralPosition,
      LiquidationEvent,
      MarketSnapshot,
      Asset,
      User,
    ]),
  ],
  providers: [StellarIndexerService, EventProcessorService, IndexerGateway],
  exports: [StellarIndexerService, EventProcessorService],
})
export class IndexerModule {}
