import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ProtocolStatsService {
  private readonly logger = new Logger(ProtocolStatsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SupplyPosition)
    private readonly supplyRepo: Repository<SupplyPosition>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(LiquidationEvent)
    private readonly liquidationEventRepo: Repository<LiquidationEvent>,
  ) {}

  async getGlobalStats(): Promise<{
    activeUsers: number;
    totalSuppliers: number;
    totalBorrowers: number;
    activePositions: number;
    totalLiquidations: number;
    liquidationVolumeUsd: string;
  }> {
    const activeUsers = await this.userRepo.count();

    const suppliers = await this.supplyRepo
      .createQueryBuilder('s')
      .select('COUNT(DISTINCT s.user_id)', 'count')
      .getRawOne();

    const borrowers = await this.borrowRepo
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b.user_id)', 'count')
      .getRawOne();

    const supplyCount = await this.supplyRepo.count({
      where: { amount: MoreThan('0') },
    });
    const borrowCount = await this.borrowRepo.count({
      where: { amount: MoreThan('0') },
    });
    const collateralCount = await this.collateralRepo.count({
      where: { amount: MoreThan('0') },
    });

    const liquidationCount = await this.liquidationEventRepo.count();

    const liquidations = await this.liquidationEventRepo.find();
    let liquidationVolume = 0;
    for (const liq of liquidations) {
      liquidationVolume += parseFloat(liq.debtAmount);
    }

    return {
      activeUsers,
      totalSuppliers: parseInt(suppliers?.count || '0', 10),
      totalBorrowers: parseInt(borrowers?.count || '0', 10),
      activePositions: supplyCount + borrowCount + collateralCount,
      totalLiquidations: liquidationCount,
      liquidationVolumeUsd: liquidationVolume.toString(),
    };
  }

  async getUserStats(
    address: string,
  ): Promise<{
    totalSupplied: string;
    totalBorrowed: string;
    totalCollateral: string;
    liquidationEvents: number;
  }> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return { totalSupplied: '0', totalBorrowed: '0', totalCollateral: '0', liquidationEvents: 0 };
    }

    const supplies = await this.supplyRepo.find({ where: { user: { id: user.id } } });
    const borrows = await this.borrowRepo.find({ where: { user: { id: user.id } } });
    const collaterals = await this.collateralRepo.find({ where: { user: { id: user.id } } });

    const totalSupplied = supplies.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalBorrowed = borrows.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalCollateral = collaterals.reduce((s, p) => s + parseFloat(p.amount), 0);

    const liquidationEvents = await this.liquidationEventRepo.count({
      where: [
        { borrower: { id: user.id } },
        { liquidator: { id: user.id } },
      ],
    });

    return {
      totalSupplied: totalSupplied.toString(),
      totalBorrowed: totalBorrowed.toString(),
      totalCollateral: totalCollateral.toString(),
      liquidationEvents,
    };
  }
}
