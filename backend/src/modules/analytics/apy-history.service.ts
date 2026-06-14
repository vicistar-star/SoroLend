import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';

@Injectable()
export class ApyHistoryService {
  private readonly logger = new Logger(ApyHistoryService.name);

  constructor(
    @InjectRepository(MarketSnapshot)
    private readonly snapshotRepo: Repository<MarketSnapshot>,
  ) {}

  async getApyHistory(
    assetId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    { snapshotAt: Date; supplyRate: string; borrowRate: string; utilizationRate: string }[]
  > {
    const snapshots = await this.snapshotRepo.find({
      where: {
        asset: { id: assetId },
        snapshotAt: Between(startDate, endDate),
      },
      order: { snapshotAt: 'ASC' },
    });

    return snapshots.map((s) => ({
      snapshotAt: s.snapshotAt,
      supplyRate: s.supplyRate,
      borrowRate: s.borrowRate,
      utilizationRate: s.utilizationRate,
    }));
  }

  async getLatestApy(
    assetId: string,
  ): Promise<{ supplyRate: string; borrowRate: string; utilizationRate: string } | null> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { asset: { id: assetId } },
      order: { snapshotAt: 'DESC' },
    });

    if (!snapshot) return null;

    return {
      supplyRate: snapshot.supplyRate,
      borrowRate: snapshot.borrowRate,
      utilizationRate: snapshot.utilizationRate,
    };
  }
}
