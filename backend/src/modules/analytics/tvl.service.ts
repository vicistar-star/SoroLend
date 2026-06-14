import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';

@Injectable()
export class TvlService {
  private readonly logger = new Logger(TvlService.name);

  constructor(
    @InjectRepository(SupplyPosition)
    private readonly supplyRepo: Repository<SupplyPosition>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async getTotalValueLocked(): Promise<{
    totalUsd: string;
    byAsset: { assetCode: string; amount: string; usdValue: string }[];
  }> {
    const assets = await this.assetRepo.find({ where: { isActive: true } });
    const byAsset: { assetCode: string; amount: string; usdValue: string }[] = [];

    let totalUsd = 0;

    for (const asset of assets) {
      const supplies = await this.supplyRepo.find({
        where: { asset: { id: asset.id } },
      });

      const totalSupply = supplies.reduce(
        (sum, s) => sum + parseFloat(s.amount),
        0,
      );

      const price = asset.oraclePrice ? parseFloat(asset.oraclePrice) : 0;
      const usdValue = totalSupply * price;
      totalUsd += usdValue;

      byAsset.push({
        assetCode: asset.code,
        amount: totalSupply.toString(),
        usdValue: usdValue.toString(),
      });
    }

    return { totalUsd: totalUsd.toString(), byAsset };
  }

  async getTvlByAsset(assetCode: string): Promise<{
    assetCode: string;
    totalSupplied: string;
    totalBorrowed: string;
    netTvl: string;
  }> {
    const asset = await this.assetRepo.findOne({ where: { code: assetCode, isActive: true } });
    if (!asset) {
      throw new Error(`Asset not found: ${assetCode}`);
    }

    const supplies = await this.supplyRepo.find({
      where: { asset: { id: asset.id } },
    });

    const borrows = await this.borrowRepo.find({
      where: { asset: { id: asset.id } },
    });

    const totalSupplied = supplies.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalBorrowed = borrows.reduce((s, p) => s + parseFloat(p.amount), 0);

    return {
      assetCode,
      totalSupplied: totalSupplied.toString(),
      totalBorrowed: totalBorrowed.toString(),
      netTvl: (totalSupplied - totalBorrowed).toString(),
    };
  }
}
