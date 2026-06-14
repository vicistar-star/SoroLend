import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';
import { User } from '../../database/entities/user.entity';

export interface IndexedEvent {
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'liquidation';
  user: string;
  asset: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    @InjectRepository(SupplyPosition)
    private readonly supplyRepo: Repository<SupplyPosition>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepo: Repository<BorrowPosition>,
    @InjectRepository(CollateralPosition)
    private readonly collateralRepo: Repository<CollateralPosition>,
    @InjectRepository(LiquidationEvent)
    private readonly liquidationEventRepo: Repository<LiquidationEvent>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async processEvents(events: any[]): Promise<any[]> {
    const processed: any[] = [];

    for (const event of events) {
      try {
        const result = await this.processEvent(event);
        if (result) {
          processed.push(result);
        }
      } catch (err) {
        this.logger.warn(`Failed to process event: ${(err as Error).message}`);
      }
    }

    return processed;
  }

  async processEvent(event: IndexedEvent): Promise<any> {
    switch (event.type) {
      case 'supply':
        return this.handleSupplyEvent(event);
      case 'withdraw':
        return this.handleWithdrawEvent(event);
      case 'borrow':
        return this.handleBorrowEvent(event);
      case 'repay':
        return this.handleRepayEvent(event);
      case 'liquidation':
        return this.handleLiquidationEvent(event);
      default:
        this.logger.warn(`Unknown event type: ${(event as any).type}`);
        return null;
    }
  }

  private async findOrCreateUser(publicKey: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { publicKey } });
    if (!user) {
      user = this.userRepo.create({ publicKey });
      user = await this.userRepo.save(user);
    }
    return user;
  }

  private async findAssetByCode(code: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { code, isActive: true } });
    if (!asset) {
      throw new Error(`Asset not found: ${code}`);
    }
    return asset;
  }

  private async handleSupplyEvent(event: IndexedEvent): Promise<any> {
    const user = await this.findOrCreateUser(event.user);
    const asset = await this.findAssetByCode(event.asset);

    let position = await this.supplyRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      position.amount = (BigInt(position.amount) + BigInt(event.amount)).toString();
    } else {
      position = this.supplyRepo.create({
        user,
        asset,
        amount: event.amount,
        shares: event.amount,
        supplyIndex: '1000000000000000000',
      });
    }

    await this.supplyRepo.save(position);
    this.logger.debug(`Indexed supply: user=${event.user}, asset=${event.asset}, amount=${event.amount}`);
    return { type: 'supply', user: event.user, asset: event.asset, amount: event.amount };
  }

  private async handleWithdrawEvent(event: IndexedEvent): Promise<any> {
    const user = await this.findOrCreateUser(event.user);
    const asset = await this.findAssetByCode(event.asset);

    const position = await this.supplyRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      const current = BigInt(position.amount);
      const withdrawal = BigInt(event.amount);
      position.amount = current >= withdrawal ? (current - withdrawal).toString() : '0';
      await this.supplyRepo.save(position);
    }

    return { type: 'withdraw', user: event.user, asset: event.asset, amount: event.amount };
  }

  private async handleBorrowEvent(event: IndexedEvent): Promise<any> {
    const user = await this.findOrCreateUser(event.user);
    const asset = await this.findAssetByCode(event.asset);

    let position = await this.borrowRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      position.amount = (BigInt(position.amount) + BigInt(event.amount)).toString();
    } else {
      position = this.borrowRepo.create({
        user,
        asset,
        amount: event.amount,
        interestIndex: '1000000000000000000',
        accruedInterest: '0',
      });
    }

    await this.borrowRepo.save(position);
    return { type: 'borrow', user: event.user, asset: event.asset, amount: event.amount };
  }

  private async handleRepayEvent(event: IndexedEvent): Promise<any> {
    const user = await this.findOrCreateUser(event.user);
    const asset = await this.findAssetByCode(event.asset);

    const position = await this.borrowRepo.findOne({
      where: { user: { id: user.id }, asset: { id: asset.id } },
    });

    if (position) {
      const current = BigInt(position.amount);
      const repayment = BigInt(event.amount);
      position.amount = current >= repayment ? (current - repayment).toString() : '0';
      await this.borrowRepo.save(position);
    }

    return { type: 'repay', user: event.user, asset: event.asset, amount: event.amount };
  }

  private async handleLiquidationEvent(event: IndexedEvent): Promise<any> {
    this.logger.debug(`[STUB] Indexing liquidation event: ${JSON.stringify(event)}`);
    return { type: 'liquidation', user: event.user, asset: event.asset, amount: event.amount };
  }
}
