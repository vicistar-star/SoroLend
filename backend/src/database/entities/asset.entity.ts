import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BorrowPosition } from './borrow-position.entity';
import { CollateralPosition } from './collateral-position.entity';
import { LiquidationEvent } from './liquidation-event.entity';
import { MarketSnapshot } from './market-snapshot.entity';
import { PriceFeed } from './price-feed.entity';
import { SupplyPosition } from './supply-position.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 12 })
  code: string;

  @Column({ type: 'varchar', length: 56, nullable: true })
  issuer: string | null;

  @Index({ unique: true })
  @Column({ name: 'contract_id', type: 'varchar', length: 56 })
  contractId: string;

  @Column({ type: 'integer', default: 7 })
  decimals: number;

  @Column({
    name: 'oracle_price',
    type: 'numeric',
    precision: 38,
    scale: 18,
    nullable: true,
  })
  oraclePrice: string | null;

  @Column({ name: 'oracle_updated_at', type: 'timestamptz', nullable: true })
  oracleUpdatedAt: Date | null;

  @Column({
    name: 'ltv_ratio',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  ltvRatio: string | null;

  @Column({
    name: 'liquidation_threshold',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  liquidationThreshold: string | null;

  @Column({
    name: 'liquidation_penalty',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  liquidationPenalty: string | null;

  @Column({
    name: 'reserve_factor',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  reserveFactor: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SupplyPosition, (pos) => pos.asset)
  supplyPositions: SupplyPosition[];

  @OneToMany(() => BorrowPosition, (pos) => pos.asset)
  borrowPositions: BorrowPosition[];

  @OneToMany(() => CollateralPosition, (pos) => pos.asset)
  collateralPositions: CollateralPosition[];

  @OneToMany(() => MarketSnapshot, (snap) => snap.asset)
  snapshots: MarketSnapshot[];

  @OneToMany(() => PriceFeed, (feed) => feed.asset)
  priceFeeds: PriceFeed[];

  @OneToMany(() => LiquidationEvent, (evt) => evt.debtAsset)
  liquidationDebts: LiquidationEvent[];

  @OneToMany(() => LiquidationEvent, (evt) => evt.collateralAsset)
  liquidationCollaterals: LiquidationEvent[];
}
