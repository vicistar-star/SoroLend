import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

import { LiquidationGateway } from './liquidation.gateway';
import { LiquidationService } from './liquidation.service';

@Injectable()
export class LiquidationBot {
  private readonly logger = new Logger(LiquidationBot.name);

  constructor(
    private readonly liquidationService: LiquidationService,
    private readonly liquidationGateway: LiquidationGateway,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Cron('*/15 * * * * *')
  async scanAndLiquidate(): Promise<void> {
    this.logger.debug('Running liquidation bot scan...');

    try {
      const atRisk = await this.liquidationService.getAtRiskPositions();

      for (const position of atRisk) {
        try {
          const optimalCover = await this.calculateOptimalDebtCover(
            position.userId,
            position.totalBorrowUsd,
          );

          if (optimalCover) {
            this.logger.log(
              `Liquidating user=${position.publicKey}, health=${position.healthFactor.toFixed(4)}, ` +
                `debtAsset=${optimalCover.debtAssetCode}, collateralAsset=${optimalCover.collateralAssetCode}`,
            );

            await this.liquidationService.liquidate(
              'liquidation-bot',
              position.userId,
              optimalCover.debtAssetCode,
              optimalCover.collateralAssetCode,
            );

            this.liquidationGateway.broadcastLiquidationEvent({
              borrower: position.publicKey,
              healthFactor: position.healthFactor,
              debtAsset: optimalCover.debtAssetCode,
              collateralAsset: optimalCover.collateralAssetCode,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          this.logger.warn(
            `Failed to liquidate user=${position.publicKey}: ${(err as Error).message}`,
          );
        }
      }

      if (atRisk.length > 0) {
        this.logger.log(`Liquidation scan completed: ${atRisk.length} position(s) at risk`);
      }
    } catch (err) {
      this.logger.error(`Liquidation bot scan error: ${(err as Error).message}`);
    }
  }

  private async calculateOptimalDebtCover(
    userId: string,
    _totalBorrowUsd: number,
  ): Promise<{ debtAssetCode: string; collateralAssetCode: string } | null> {
    const borrows = await this.borrowRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    const collaterals = await this.collateralRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    if (borrows.length === 0 || collaterals.length === 0) {
      return null;
    }

    const largestBorrow = borrows.reduce((max, b) =>
      parseFloat(b.amount) > parseFloat(max.amount) ? b : max,
    );

    const bestCollateral = collaterals.reduce((best, c) => {
      const bestPrice = best.asset.oraclePrice ? parseFloat(best.asset.oraclePrice) : 0;
      const cPrice = c.asset.oraclePrice ? parseFloat(c.asset.oraclePrice) : 0;
      return cPrice * parseFloat(c.amount) > bestPrice * parseFloat(best.amount) ? c : best;
    });

    return {
      debtAssetCode: largestBorrow.asset.code,
      collateralAssetCode: bestCollateral.asset.code,
    };
  }
}
