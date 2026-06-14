import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PriceFeed } from '../../database/entities/price-feed.entity';

@Injectable()
export class TwapService {
  private readonly logger = new Logger(TwapService.name);

  constructor(
    @InjectRepository(PriceFeed)
    private readonly priceFeedRepo: Repository<PriceFeed>,
  ) {}

  async calculateTwap(assetId: string, periods: number = 10): Promise<string> {
    const feeds = await this.priceFeedRepo.find({
      where: { asset: { id: assetId } },
      order: { timestamp: 'DESC' },
      take: periods,
    });

    if (feeds.length === 0) {
      return '0';
    }

    const totalWeight = feeds.reduce((sum, _, i) => sum + (feeds.length - i), 0);
    let weightedSum = 0;

    for (let i = 0; i < feeds.length; i++) {
      const weight = feeds.length - i;
      weightedSum += parseFloat(feeds[i].price) * weight;
    }

    return (weightedSum / totalWeight).toFixed(18);
  }

  async calculateSimpleTwap(assetId: string, periods: number = 10): Promise<string> {
    const feeds = await this.priceFeedRepo.find({
      where: { asset: { id: assetId } },
      order: { timestamp: 'DESC' },
      take: periods,
    });

    if (feeds.length === 0) {
      return '0';
    }

    const sum = feeds.reduce((acc, feed) => acc + parseFloat(feed.price), 0);
    return (sum / feeds.length).toFixed(18);
  }

  async calculateTwapWithThreshold(
    assetId: string,
    periods: number,
    maxDeviation: number,
  ): Promise<string> {
    const feeds = await this.priceFeedRepo.find({
      where: { asset: { id: assetId } },
      order: { timestamp: 'DESC' },
      take: periods,
    });

    if (feeds.length === 0) {
      return '0';
    }

    const prices = feeds.map((f) => parseFloat(f.price));
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const filtered = prices.filter((p) => Math.abs(p - mean) / mean <= maxDeviation);

    if (filtered.length === 0) {
      return mean.toFixed(18);
    }

    return (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(18);
  }
}
