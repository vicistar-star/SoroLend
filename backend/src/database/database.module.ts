import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from './entities/asset.entity';
import { BorrowPosition } from './entities/borrow-position.entity';
import { CollateralPosition } from './entities/collateral-position.entity';
import { LiquidationEvent } from './entities/liquidation-event.entity';
import { MarketSnapshot } from './entities/market-snapshot.entity';
import { PriceFeed } from './entities/price-feed.entity';
import { Proposal } from './entities/proposal.entity';
import { SupplyPosition } from './entities/supply-position.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';

const entities = [
  User,
  Asset,
  SupplyPosition,
  BorrowPosition,
  CollateralPosition,
  MarketSnapshot,
  LiquidationEvent,
  PriceFeed,
  Proposal,
  Vote,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get<string>('DB_NAME'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        entities,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
