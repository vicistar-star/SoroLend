import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';

import { OracleAggregatorService } from './oracle-aggregator.service';

@Injectable()
export class OracleScheduler {
  private readonly logger = new Logger(OracleScheduler.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly oracleAggregator: OracleAggregatorService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async refreshPrices(): Promise<void> {
    this.logger.debug('Refreshing oracle prices...');

    try {
      const assets = await this.assetRepo.find({ where: { isActive: true } });

      for (const asset of assets) {
        try {
          const result = await this.oracleAggregator.refreshPrice(asset.code);
          if (result.updated) {
            this.logger.debug(
              `Price updated for ${asset.code}: ${result.price} (source: ${result.source})`,
            );
          }
        } catch (err) {
          this.logger.warn(
            `Failed to refresh price for ${asset.code}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Price refresh error: ${(err as Error).message}`);
    }
  }
}
