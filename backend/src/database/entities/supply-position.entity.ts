import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Asset } from './asset.entity';
import { User } from './user.entity';

@Entity('supply_positions')
@Index(['user', 'asset'], { unique: true })
export class SupplyPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.supplyPositions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Asset, (a) => a.supplyPositions, { onDelete: 'CASCADE' })
  asset: Asset;

  @Column({
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '0',
  })
  amount: string;

  @Column({
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '0',
  })
  shares: string;

  @Column({
    name: 'supply_index',
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '1000000000000000000',
  })
  supplyIndex: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
