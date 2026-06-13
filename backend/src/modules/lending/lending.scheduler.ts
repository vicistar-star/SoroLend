import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';

import { LendingGateway } from './lending.gateway';

@Injectable()
export class LendingScheduler {
  private readonly logger = new Logger(LendingScheduler.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(MarketSnapshot)
    private readonly snapshotRepo: Repository<MarketSnapshot>,
    private readonly lendingGateway: LendingGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncInterestAccrual(): Promise<void> {
    this.logger.debug('[STUB] Syncing interest accrual...');

    const assets = await this.assetRepo.find({ where: { isActive: true } });

    for (const asset of assets) {
      const snapshot = this.snapshotRepo.create({
        asset,
        totalSupply: '0',
        totalBorrow: '0',
        totalReserves: '0',
        supplyIndex: '1000000000000000000',
        borrowIndex: '1000000000000000000',
        borrowRate: '0',
        supplyRate: '0',
        utilizationRate: '0',
      });
      await this.snapshotRepo.save(snapshot);

      this.lendingGateway.broadcastMarketUpdate({
        assetCode: asset.code,
        timestamp: snapshot.snapshotAt,
        totalSupply: snapshot.totalSupply,
        totalBorrow: snapshot.totalBorrow,
        borrowRate: snapshot.borrowRate,
        supplyRate: snapshot.supplyRate,
        utilizationRate: snapshot.utilizationRate,
      });
    }
  }
}
