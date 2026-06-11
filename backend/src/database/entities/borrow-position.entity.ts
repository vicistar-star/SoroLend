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

@Entity('borrow_positions')
@Index(['user', 'asset'], { unique: true })
export class BorrowPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.borrowPositions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Asset, (a) => a.borrowPositions, { onDelete: 'CASCADE' })
  asset: Asset;

  @Column({
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '0',
  })
  amount: string;

  @Column({
    name: 'interest_index',
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '1000000000000000000',
  })
  interestIndex: string;

  @Column({
    name: 'accrued_interest',
    type: 'numeric',
    precision: 38,
    scale: 18,
    default: '0',
  })
  accruedInterest: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
