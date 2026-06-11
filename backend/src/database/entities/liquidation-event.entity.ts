import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Asset } from './asset.entity';
import { User } from './user.entity';

@Entity('liquidation_events')
export class LiquidationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.liquidationsInitiated, { onDelete: 'CASCADE' })
  liquidator: User;

  @ManyToOne(() => User, (u) => u.liquidationsReceived, { onDelete: 'CASCADE' })
  borrower: User;

  @ManyToOne(() => Asset, (a) => a.liquidationDebts, { onDelete: 'CASCADE' })
  debtAsset: Asset;

  @ManyToOne(() => Asset, (a) => a.liquidationCollaterals, { onDelete: 'CASCADE' })
  collateralAsset: Asset;

  @Column({ name: 'debt_amount', type: 'numeric', precision: 38, scale: 18 })
  debtAmount: string;

  @Column({ name: 'collateral_seized', type: 'numeric', precision: 38, scale: 18 })
  collateralSeized: string;

  @Column({ name: 'bonus_amount', type: 'numeric', precision: 38, scale: 18 })
  bonusAmount: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 64 })
  txHash: string;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
