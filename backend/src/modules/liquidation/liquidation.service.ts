import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class LiquidationService {
  private readonly logger = new Logger(LiquidationService.name);

  private readonly HEALTH_FACTOR_BUFFER = 1.05;

  constructor(
    @InjectRepository(LiquidationEvent)
    private readonly liquidationEventRepo: Repository<LiquidationEvent>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getAtRiskPositions(): Promise<{
    userId: string;
    publicKey: string;
    healthFactor: number;
    totalCollateralUsd: number;
    totalBorrowUsd: number;
  }[]> {
    const users = await this.userRepo.find();
    const atRisk: {
      userId: string;
      publicKey: string;
      healthFactor: number;
      totalCollateralUsd: number;
      totalBorrowUsd: number;
    }[] = [];

    for (const user of users) {
      const health = await this.computeHealthFactor(user.id);
      if (health !== null && health.healthFactor < this.HEALTH_FACTOR_BUFFER && health.healthFactor > 0) {
        atRisk.push({
          userId: user.id,
          publicKey: user.publicKey,
          healthFactor: health.healthFactor,
          totalCollateralUsd: health.totalCollateralUsd,
          totalBorrowUsd: health.totalBorrowUsd,
        });
      }
    }

    return atRisk;
  }

  async liquidate(
    liquidatorKey: string,
    borrowerId: string,
    debtAssetCode: string,
    collateralAssetCode: string,
  ): Promise<LiquidationEvent> {
    const liquidator = await this.findOrCreateUser(liquidatorKey);
    const borrower = await this.userRepo.findOne({ where: { id: borrowerId } });
    if (!borrower) {
      throw new Error('Borrower not found');
    }

    const debtAsset = await this.assetRepo.findOne({ where: { code: debtAssetCode, isActive: true } });
    const collateralAsset = await this.assetRepo.findOne({
      where: { code: collateralAssetCode, isActive: true },
    });
    if (!debtAsset || !collateralAsset) {
      throw new Error('Asset not found');
    }

    const debtPosition = await this.borrowRepo.findOne({
      where: { user: { id: borrowerId }, asset: { id: debtAsset.id } },
    });
    if (!debtPosition) {
      throw new Error('Debt position not found');
    }

    const collateralPosition = await this.collateralRepo.findOne({
      where: { user: { id: borrowerId }, asset: { id: collateralAsset.id } },
    });
    if (!collateralPosition) {
      throw new Error('Collateral position not found');
    }

    const debtAmount = debtPosition.amount;
    const debtPrice = debtAsset.oraclePrice ? parseFloat(debtAsset.oraclePrice) : 0;
    const collateralPrice = collateralAsset.oraclePrice ? parseFloat(collateralAsset.oraclePrice) : 0;
    const penaltyRate = collateralAsset.liquidationPenalty
      ? parseFloat(collateralAsset.liquidationPenalty)
      : 0.05;

    if (debtPrice === 0 || collateralPrice === 0) {
      throw new Error('Oracle price not available');
    }

    const debtUsdValue = parseFloat(debtAmount) * debtPrice;
    const collateralUsdValue = parseFloat(collateralPosition.amount) * collateralPrice;

    const bonusMultiplier = 1 + penaltyRate;
    const maxCollateralSeizedUsd = debtUsdValue * bonusMultiplier;
    const collateralSeizedAmount =
      maxCollateralSeizedUsd / collateralPrice;
    const actualSeized = Math.min(
      collateralSeizedAmount,
      parseFloat(collateralPosition.amount),
    );
    const bonusAmount = actualSeized * penaltyRate;

    this.logger.debug(
      `[STUB] Soroban liquidate: liquidator=${liquidatorKey}, borrower=${borrower.publicKey}, debt=${debtAmount} ${debtAssetCode}, seize=${actualSeized} ${collateralAssetCode}`,
    );

    const debtRemaining = parseFloat(debtAmount) - debtUsdValue / debtPrice;
    debtPosition.amount = Math.max(0, debtRemaining).toString();
    await this.borrowRepo.save(debtPosition);

    const collateralRemaining = parseFloat(collateralPosition.amount) - actualSeized;
    collateralPosition.amount = Math.max(0, collateralRemaining).toString();
    await this.collateralRepo.save(collateralPosition);

    const event = this.liquidationEventRepo.create({
      liquidator,
      borrower,
      debtAsset,
      collateralAsset,
      debtAmount: debtAmount,
      collateralSeized: actualSeized.toString(),
      bonusAmount: bonusAmount.toString(),
      txHash: `stub-${Date.now()}`,
      blockNumber: null,
    });

    return this.liquidationEventRepo.save(event);
  }

  async computeHealthFactor(userId: string): Promise<{
    healthFactor: number;
    totalCollateralUsd: number;
    totalBorrowUsd: number;
  } | null> {
    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    if (borrowPositions.length === 0) {
      return null;
    }

    let totalCollateralUsd = 0;
    let totalBorrowUsd = 0;

    for (const cp of collateralPositions) {
      const price = cp.asset.oraclePrice ? parseFloat(cp.asset.oraclePrice) : 0;
      const threshold = cp.asset.liquidationThreshold
        ? parseFloat(cp.asset.liquidationThreshold)
        : 0;
      totalCollateralUsd += parseFloat(cp.amount) * price * threshold;
    }

    for (const bp of borrowPositions) {
      const price = bp.asset.oraclePrice ? parseFloat(bp.asset.oraclePrice) : 0;
      totalBorrowUsd += parseFloat(bp.amount) * price;
    }

    const healthFactor =
      totalBorrowUsd > 0 ? totalCollateralUsd / totalBorrowUsd : 999.9999;

    return { healthFactor, totalCollateralUsd, totalBorrowUsd };
  }

  private async findOrCreateUser(publicKey: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { publicKey } });
    if (!user) {
      user = this.userRepo.create({ publicKey });
      user = await this.userRepo.save(user);
    }
    return user;
  }
}
