import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { MarketSnapshot } from '../../database/entities/market-snapshot.entity';

import { EventProcessorService } from './event-processor.service';
import { IndexerGateway } from './indexer.gateway';

@Injectable()
export class StellarIndexerService {
  private readonly logger = new Logger(StellarIndexerService.name);

  private lastPolledBlock: number = 0;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(MarketSnapshot)
    private readonly snapshotRepo: Repository<MarketSnapshot>,
    private readonly eventProcessor: EventProcessorService,
    private readonly indexerGateway: IndexerGateway,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollSorobanRpc(): Promise<void> {
    this.logger.debug('Polling Soroban RPC for contract events...');

    try {
      const events = await this.fetchContractEvents(this.lastPolledBlock);
      if (events.length > 0) {
        this.logger.debug(`Found ${events.length} new events`);

        const processed = await this.eventProcessor.processEvents(events);
        this.lastPolledBlock = events[events.length - 1].blockNumber;

        for (const event of processed) {
          this.indexerGateway.broadcastIndexedEvent(event);
        }
      }
    } catch (err) {
      this.logger.error(`Soroban RPC polling error: ${(err as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async snapshotMarkets(): Promise<void> {
    this.logger.debug('Taking market snapshots...');

    try {
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
      }
    } catch (err) {
      this.logger.error(`Market snapshot error: ${(err as Error).message}`);
    }
  }

  private async fetchContractEvents(fromBlock: number): Promise<any[]> {
    this.logger.debug(`[STUB] Fetching Soroban events from block ${fromBlock}`);
    return [];
  }
}
