import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Asset } from './asset.entity';

@Entity('price_feeds')
@Index(['asset', 'timestamp'])
export class PriceFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (a) => a.priceFeeds, { onDelete: 'CASCADE' })
  asset: Asset;

  @Column({ type: 'numeric', precision: 38, scale: 18 })
  price: string;

  @Column({ type: 'varchar', length: 50 })
  source: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
