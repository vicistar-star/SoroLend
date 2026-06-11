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

@Entity('collateral_positions')
@Index(['user', 'asset'], { unique: true })
export class CollateralPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.collateralPositions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Asset, (a) => a.collateralPositions, { onDelete: 'CASCADE' })
  asset: Asset;

  @Column({
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '0',
  })
  amount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
