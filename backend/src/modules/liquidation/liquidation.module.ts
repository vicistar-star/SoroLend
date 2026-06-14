import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { User } from '../../database/entities/user.entity';

import { LiquidationBot } from './liquidation.bot';
import { LiquidationGateway } from './liquidation.gateway';
import { LiquidationService } from './liquidation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiquidationEvent,
      BorrowPosition,
      CollateralPosition,
      Asset,
      User,
    ]),
  ],
  providers: [LiquidationService, LiquidationBot, LiquidationGateway],
  exports: [LiquidationService],
})
export class LiquidationModule {}
