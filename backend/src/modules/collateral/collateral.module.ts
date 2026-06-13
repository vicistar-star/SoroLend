import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

import { CollateralController } from './collateral.controller';
import { CollateralService } from './collateral.service';

@Module({
  imports: [TypeOrmModule.forFeature([CollateralPosition, BorrowPosition, Asset, User])],
  controllers: [CollateralController],
  providers: [CollateralService],
  exports: [CollateralService],
})
export class CollateralModule {}
