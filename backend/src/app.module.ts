import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { BorrowingModule } from './modules/borrowing/borrowing.module';
import { CollateralModule } from './modules/collateral/collateral.module';
import { LendingModule } from './modules/lending/lending.module';
import { LiquidationModule } from './modules/liquidation/liquidation.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

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
    LiquidationModule,
    OracleModule,
    IndexerModule,
    GovernanceModule,
    NotificationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
