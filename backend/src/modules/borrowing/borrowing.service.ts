import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class BorrowingService {
  private readonly logger = new Logger(BorrowingService.name);

  constructor(
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async borrow(publicKey: string, assetCode: string, amount: string): Promise<BorrowPosition> {
    const user = await this.findOrCreateUser(publicKey);
    const asset = await this.findAssetByCode(assetCode);

    const healthOk = await this.validateHealthForBorrow(user.id, asset, amount);
    if (!healthOk) {
      throw new BadRequestException('Borrow would put health factor below minimum threshold');
    }

    this.logger.debug(`[STUB] Soroban borrow: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    let position = await this.borrowRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      const currentAmount = BigInt(position.amount);
      position.amount = (currentAmount + BigInt(amount)).toString();
    } else {
      position = this.borrowRepo.create({
        user,
        asset,
        amount,
        interestIndex: '1000000000000000000',
        accruedInterest: '0',
      });
    }

    await this.borrowRepo.save(position);
    return position;
  }

  async repay(publicKey: string, assetCode: string, amount: string): Promise<BorrowPosition> {
    const user = await this.findOrCreateUser(publicKey);
    const asset = await this.findAssetByCode(assetCode);

    const position = await this.borrowRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
      relations: ['asset'],
    });

    if (!position) {
      throw new NotFoundException('Borrow position not found');
    }

    const currentAmount = BigInt(position.amount);
    const repayAmount = BigInt(amount);

    if (repayAmount > currentAmount) {
      throw new BadRequestException('Repay amount exceeds outstanding debt');
    }

    this.logger.debug(`[STUB] Soroban repay: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    position.amount = (currentAmount - repayAmount).toString();
    await this.borrowRepo.save(position);
    return position;
  }

  async getPositions(address: string): Promise<any[]> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return [];
    }

    const positions = await this.borrowRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    return positions.map((pos) => ({
      id: pos.id,
      assetCode: pos.asset.code,
      amount: pos.amount,
      interestIndex: pos.interestIndex,
      accruedInterest: pos.accruedInterest,
      assetDecimals: pos.asset.decimals,
    }));
  }

  async getHealth(address: string): Promise<{ healthFactor: string; totalCollateralUsd: string; totalBorrowUsd: string }> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return { healthFactor: '0', totalCollateralUsd: '0', totalBorrowUsd: '0' };
    }

    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    let totalCollateralUsd = BigInt(0);
    let totalBorrowUsd = BigInt(0);

    for (const cp of collateralPositions) {
      const price = cp.asset.oraclePrice ? BigInt(cp.asset.oraclePrice.replace('.', '').padEnd(18, '0')) : BigInt(0);
      const amount = BigInt(cp.amount);
      totalCollateralUsd += (amount * price) / BigInt(10) ** BigInt(cp.asset.decimals);
    }

    for (const bp of borrowPositions) {
      const price = bp.asset.oraclePrice ? BigInt(bp.asset.oraclePrice.replace('.', '').padEnd(18, '0')) : BigInt(0);
      const amount = BigInt(bp.amount);
      totalBorrowUsd += (amount * price) / BigInt(10) ** BigInt(bp.asset.decimals);
    }

    const healthFactor = totalBorrowUsd > BigInt(0)
      ? (Number(totalCollateralUsd) / Number(totalBorrowUsd)).toFixed(4)
      : '999.9999';

    return {
      healthFactor,
      totalCollateralUsd: totalCollateralUsd.toString(),
      totalBorrowUsd: totalBorrowUsd.toString(),
    };
  }

  private async validateHealthForBorrow(userId: string, _asset: Asset, _amount: string): Promise<boolean> {
    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

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

    if (totalCollateralValue === 0) {
      return false;
    }

    const healthFactor = totalCollateralValue / totalBorrowValue;
    return healthFactor > 1.0;
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
