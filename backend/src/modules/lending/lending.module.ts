import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

import { LendingController } from './lending.controller';
import { LendingGateway } from './lending.gateway';
import { LendingScheduler } from './lending.scheduler';
import { LendingService } from './lending.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupplyPosition, Asset, MarketSnapshot, User])],
  controllers: [LendingController],
  providers: [LendingService, LendingGateway, LendingScheduler],
  exports: [LendingService],
})
export class LendingModule {}
