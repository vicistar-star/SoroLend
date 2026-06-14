import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { User } from '../../database/entities/user.entity';

import { EmailService } from './email.service';
import { PushService } from './push.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  private readonly WARNING_THRESHOLD = 1.3;
  private readonly CRITICAL_THRESHOLD = 1.1;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async scanHealthFactors(): Promise<void> {
    this.logger.debug('Scanning health factors for alerts...');

    try {
      const users = await this.userRepo.find();

      for (const user of users) {
        const health = await this.computeHealthFactor(user.id);
        if (health === null) continue;

        if (health.healthFactor <= this.CRITICAL_THRESHOLD) {
          this.logger.warn(
            `CRITICAL: User=${user.publicKey} health factor=${health.healthFactor.toFixed(4)}`,
          );
          await this.pushService.sendHealthAlert(user.publicKey, health.healthFactor);
        } else if (health.healthFactor <= this.WARNING_THRESHOLD) {
          this.logger.debug(
            `WARNING: User=${user.publicKey} health factor=${health.healthFactor.toFixed(4)}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Health factor scan error: ${(err as Error).message}`);
    }
  }

  private async computeHealthFactor(userId: string): Promise<{ healthFactor: number } | null> {
    const collateralPositions = await this.collateralRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    const borrowPositions = await this.borrowRepo.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });

    if (borrowPositions.length === 0) return null;

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

    const healthFactor = totalBorrowUsd > 0 ? totalCollateralUsd / totalBorrowUsd : 999.9999;
    return { healthFactor };
  }
}
