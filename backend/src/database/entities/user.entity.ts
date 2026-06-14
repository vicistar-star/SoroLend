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
import { SupplyPosition } from './supply-position.entity';
import { Vote } from './vote.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'public_key', type: 'varchar', length: 56 })
  publicKey: string;

  @Column({ name: 'nonce', type: 'varchar', length: 64, nullable: true })
  nonce: string | null;

  @Column({ name: 'nonce_expires_at', type: 'timestamptz', nullable: true })
  nonceExpiresAt: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SupplyPosition, (pos) => pos.user)
  supplyPositions: SupplyPosition[];

  @OneToMany(() => BorrowPosition, (pos) => pos.user)
  borrowPositions: BorrowPosition[];

  @OneToMany(() => CollateralPosition, (pos) => pos.user)
  collateralPositions: CollateralPosition[];

  @OneToMany(() => LiquidationEvent, (evt) => evt.liquidator)
  liquidationsInitiated: LiquidationEvent[];

  @OneToMany(() => LiquidationEvent, (evt) => evt.borrower)
  liquidationsReceived: LiquidationEvent[];

  @OneToMany(() => Vote, (v) => v.voter)
  votes: Vote[];
}
