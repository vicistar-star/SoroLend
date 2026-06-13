import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { BorrowingModule } from './modules/borrowing/borrowing.module';
import { CollateralModule } from './modules/collateral/collateral.module';
import { LendingModule } from './modules/lending/lending.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    CacheModule,
    AuthModule,
    LendingModule,
    BorrowingModule,
    CollateralModule,
  ],
})
export class AppModule {}
