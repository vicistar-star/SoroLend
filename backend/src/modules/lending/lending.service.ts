import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class LendingService {
  private readonly logger = new Logger(LendingService.name);

  constructor(
    @InjectRepository(SupplyPosition)
    private readonly supplyRepo: Repository<SupplyPosition>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async supply(publicKey: string, assetCode: string, amount: string): Promise<SupplyPosition> {
    const asset = await this.findAssetByCode(assetCode);
    const user = await this.findOrCreateUser(publicKey);

    this.logger.debug(`[STUB] Soroban supply: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    let position = await this.supplyRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      const currentAmount = position.amount;
      const newAmount = (BigInt(currentAmount) + BigInt(amount)).toString();
      position.amount = newAmount;
    } else {
      position = this.supplyRepo.create({
        user,
        asset,
        amount,
        shares: amount,
        supplyIndex: '1000000000000000000',
      });
    }

    await this.supplyRepo.save(position);
    return position;
  }

  async withdraw(publicKey: string, assetCode: string, amount: string): Promise<SupplyPosition> {
    const asset = await this.findAssetByCode(assetCode);
    const user = await this.findOrCreateUser(publicKey);

    const position = await this.supplyRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
      relations: ['asset'],
    });

    if (!position) {
      throw new NotFoundException('Supply position not found');
    }

    const currentAmount = BigInt(position.amount);
    const withdrawAmount = BigInt(amount);

    if (withdrawAmount > currentAmount) {
      throw new BadRequestException('Insufficient supply balance');
    }

    this.logger.debug(`[STUB] Soroban withdraw: user=${publicKey}, asset=${assetCode}, amount=${amount}`);

    position.amount = (currentAmount - withdrawAmount).toString();
    await this.supplyRepo.save(position);
    return position;
  }

  async getMarkets(): Promise<any[]> {
    const assets = await this.assetRepo.find({ where: { isActive: true } });
    return assets.map((asset) => this.buildMarketResponse(asset));
  }

  async getMarket(assetCode: string): Promise<any> {
    const asset = await this.assetRepo.findOne({ where: { code: assetCode, isActive: true } });
    if (!asset) {
      throw new NotFoundException(`Market not found for asset: ${assetCode}`);
    }
    return this.buildMarketResponse(asset);
  }

  async getPositions(address: string): Promise<any[]> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return [];
    }

    const positions = await this.supplyRepo.find({
      where: { user: { id: user.id } },
      relations: ['asset'],
    });

    return positions.map((pos) => ({
      id: pos.id,
      assetCode: pos.asset.code,
      amount: pos.amount,
      shares: pos.shares,
      supplyIndex: pos.supplyIndex,
      assetDecimals: pos.asset.decimals,
    }));
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

  private buildMarketResponse(asset: Asset): any {
    return {
      id: asset.id,
      code: asset.code,
      decimals: asset.decimals,
      oraclePrice: asset.oraclePrice,
      oracleUpdatedAt: asset.oracleUpdatedAt,
      ltvRatio: asset.ltvRatio,
      liquidationThreshold: asset.liquidationThreshold,
      liquidationPenalty: asset.liquidationPenalty,
      reserveFactor: asset.reserveFactor,
      isActive: asset.isActive,
    };
  }
}
