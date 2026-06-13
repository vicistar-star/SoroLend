import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class CollateralService {
  private readonly logger = new Logger(CollateralService.name);

  constructor(
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async deposit(publicKey: string, assetCode: string, amount: string): Promise<CollateralPosition> {
    const user = await this.findOrCreateUser(publicKey);
    const asset = await this.findAssetByCode(assetCode);

    this.logger.debug(`[STUB] Soroban deposit collateral: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    let position = await this.collateralRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      const currentAmount = BigInt(position.amount);
      position.amount = (currentAmount + BigInt(amount)).toString();
    } else {
      position = this.collateralRepo.create({
        user,
        asset,
        amount,
      });
    }

    await this.collateralRepo.save(position);
    return position;
  }

  async withdraw(publicKey: string, assetCode: string, amount: string): Promise<CollateralPosition> {
    const user = await this.findOrCreateUser(publicKey);
    const asset = await this.findAssetByCode(assetCode);

    const position = await this.collateralRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
      relations: ['asset'],
    });

    if (!position) {
      throw new NotFoundException('Collateral position not found');
    }

    const currentAmount = BigInt(position.amount);
    const withdrawAmount = BigInt(amount);

    if (withdrawAmount > currentAmount) {
      throw new BadRequestException('Insufficient collateral balance');
    }

    const remaining = (currentAmount - withdrawAmount).toString();

    const healthOk = await this.validateWithdrawPreservesHealth(user.id, remaining);
    if (!healthOk) {
      throw new BadRequestException('Withdrawal would make health factor too low');
    }

    this.logger.debug(`[STUB] Soroban withdraw collateral: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    position.amount = remaining;
    await this.collateralRepo.save(position);
    return position;
  }

  async getPortfolio(address: string): Promise<any[]> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return [];
    }

    const positions = await this.collateralRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    return positions.map((pos) => ({
      id: pos.id,
      assetCode: pos.asset.code,
      amount: pos.amount,
      assetDecimals: pos.asset.decimals,
      oraclePrice: pos.asset.oraclePrice,
      estimatedValueUsd: this.estimateUsdValue(pos.amount, pos.asset),
    }));
  }

  async getMaxBorrow(address: string): Promise<{ maxBorrowUsd: string; totalCollateralUsd: string; currentBorrowUsd: string }> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return { maxBorrowUsd: '0', totalCollateralUsd: '0', currentBorrowUsd: '0' };
    }

    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    let totalCollateralUsd = 0;
    let totalBorrowUsd = 0;

    for (const cp of collateralPositions) {
      const price = cp.asset.oraclePrice ? parseFloat(cp.asset.oraclePrice) : 0;
      const ltv = cp.asset.ltvRatio ? parseFloat(cp.asset.ltvRatio) : 0;
      totalCollateralUsd += parseFloat(cp.amount) * price * ltv;
    }

    for (const bp of borrowPositions) {
      const price = bp.asset.oraclePrice ? parseFloat(bp.asset.oraclePrice) : 0;
      totalBorrowUsd += parseFloat(bp.amount) * price;
    }

    const maxBorrowUsd = Math.max(0, totalCollateralUsd - totalBorrowUsd);

    return {
      maxBorrowUsd: maxBorrowUsd.toFixed(18),
      totalCollateralUsd: totalCollateralUsd.toFixed(18),
      currentBorrowUsd: totalBorrowUsd.toFixed(18),
    };
  }

  private async validateWithdrawPreservesHealth(userId: string, _remainingCollateral: string): Promise<boolean> {
    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    if (borrowPositions.length === 0) {
      return true;
    }

    let totalCollateralValue = 0;
    let totalBorrowValue = 0;

    for (const cp of collateralPositions) {
      const price = cp.asset.oraclePrice ? parseFloat(cp.asset.oraclePrice) : 0;
      const threshold = cp.asset.liquidationThreshold ? parseFloat(cp.asset.liquidationThreshold) : 0;
      totalCollateralValue += parseFloat(cp.amount) * price * threshold;
    }

    for (const bp of borrowPositions) {
      const price = bp.asset.oraclePrice ? parseFloat(bp.asset.oraclePrice) : 0;
      totalBorrowValue += parseFloat(bp.amount) * price;
    }

    if (totalBorrowValue === 0) {
      return true;
    }

    const healthFactor = totalCollateralValue / totalBorrowValue;
    return healthFactor > 1.0;
  }

  private estimateUsdValue(amount: string, asset: Asset): string {
    if (!asset.oraclePrice) return '0';
    const price = parseFloat(asset.oraclePrice);
    const value = parseFloat(amount) * price;
    return value.toFixed(18);
  }

  private async findAssetByCode(code: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { code, isActive: true } });
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${code}`);
    }
    return asset;
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
