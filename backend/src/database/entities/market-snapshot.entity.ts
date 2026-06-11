import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Asset } from './asset.entity';

@Entity('market_snapshots')
@Index(['asset', 'snapshotAt'])
export class MarketSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (a) => a.snapshots, { onDelete: 'CASCADE' })
  asset: Asset;

  @Column({ name: 'total_supply', type: 'numeric', precision: 38, scale: 18 })
  totalSupply: string;

  @Column({ name: 'total_borrow', type: 'numeric', precision: 38, scale: 18 })
  totalBorrow: string;

  @Column({ name: 'total_reserves', type: 'numeric', precision: 38, scale: 18 })
  totalReserves: string;

  @Column({ name: 'supply_index', type: 'numeric', precision: 38, scale: 18 })
  supplyIndex: string;

  @Column({ name: 'borrow_index', type: 'numeric', precision: 38, scale: 18 })
  borrowIndex: string;

  @Column({ name: 'borrow_rate', type: 'numeric', precision: 38, scale: 18 })
  borrowRate: string;

  @Column({ name: 'supply_rate', type: 'numeric', precision: 38, scale: 18 })
  supplyRate: string;

  @Column({ name: 'utilization_rate', type: 'numeric', precision: 38, scale: 18 })
  utilizationRate: string;

  @CreateDateColumn({ name: 'snapshot_at' })
  snapshotAt: Date;
}
