import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { PriceFeed } from '../../database/entities/price-feed.entity';

@Injectable()
export class OracleAggregatorService {
  private readonly logger = new Logger(OracleAggregatorService.name);

  private readonly DEVIATION_THRESHOLD = 0.02;

  constructor(
    @InjectRepository(PriceFeed)
    private readonly priceFeedRepo: Repository<PriceFeed>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async getPrice(assetCode: string): Promise<{ price: string; source: string }> {
    const asset = await this.assetRepo.findOne({ where: { code: assetCode, isActive: true } });
    if (!asset) {
      throw new Error(`Asset not found: ${assetCode}`);
    }

    if (asset.oraclePrice) {
      return { price: asset.oraclePrice, source: 'stored' };
    }

    const price = await this.fetchFromBand(assetCode);
    if (price) {
      return { price, source: 'band' };
    }

    const pythPrice = await this.fetchFromPyth(assetCode);
    if (pythPrice) {
      return { price: pythPrice, source: 'pyth' };
    }

    throw new Error(`No price available for asset: ${assetCode}`);
  }

  async refreshPrice(assetCode: string): Promise<{ price: string; source: string; updated: boolean }> {
    const asset = await this.assetRepo.findOne({ where: { code: assetCode, isActive: true } });
    if (!asset) {
      throw new Error(`Asset not found: ${assetCode}`);
    }

    const bandPrice = await this.fetchFromBand(assetCode);
    const pythPrice = await this.fetchFromPyth(assetCode);

    let selectedPrice: string | null = null;
    let source = '';

    if (bandPrice && pythPrice) {
      const bandNum = parseFloat(bandPrice);
      const pythNum = parseFloat(pythPrice);
      const deviation = Math.abs(bandNum - pythNum) / Math.max(bandNum, pythNum);

      if (deviation <= this.DEVIATION_THRESHOLD) {
        selectedPrice = ((bandNum + pythNum) / 2).toString();
        source = 'aggregated';
      } else {
        this.logger.warn(
          `Price deviation ${deviation} exceeds threshold for ${assetCode}. Band=${bandPrice}, Pyth=${pythPrice}`,
        );
        selectedPrice = bandPrice;
        source = 'band';
      }
    } else if (bandPrice) {
      selectedPrice = bandPrice;
      source = 'band';
    } else if (pythPrice) {
      selectedPrice = pythPrice;
      source = 'pyth';
    }

    if (!selectedPrice) {
      return { price: asset.oraclePrice || '0', source: 'stale', updated: false };
    }

    const currentPrice = asset.oraclePrice ? parseFloat(asset.oraclePrice) : 0;
    const newPrice = parseFloat(selectedPrice);
    const deviation = currentPrice > 0 ? Math.abs(newPrice - currentPrice) / currentPrice : 1;

    if (deviation > this.DEVIATION_THRESHOLD) {
      this.logger.log(
        `Price deviation ${deviation} for ${assetCode}: ${currentPrice} -> ${newPrice}. Updating.`,
      );
    }

    asset.oraclePrice = selectedPrice;
    asset.oracleUpdatedAt = new Date();
    await this.assetRepo.save(asset);

    const priceFeed = this.priceFeedRepo.create({
      asset,
      price: selectedPrice,
      source,
    });
    await this.priceFeedRepo.save(priceFeed);

    return { price: selectedPrice, source, updated: true };
  }

  private async fetchFromBand(assetCode: string): Promise<string | null> {
    this.logger.debug(`[STUB] Fetching ${assetCode} price from Band Protocol`);
    return null;
  }

  private async fetchFromPyth(assetCode: string): Promise<string | null> {
    this.logger.debug(`[STUB] Fetching ${assetCode} price from Pyth Network`);
    return null;
  }
}
