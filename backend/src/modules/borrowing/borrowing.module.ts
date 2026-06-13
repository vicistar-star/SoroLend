import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

import { BorrowingController } from './borrowing.controller';
import { BorrowingService } from './borrowing.service';

@Module({
  imports: [TypeOrmModule.forFeature([BorrowPosition, CollateralPosition, Asset, User])],
  controllers: [BorrowingController],
  providers: [BorrowingService],
  exports: [BorrowingService],
})
export class BorrowingModule {}
