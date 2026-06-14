import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Proposal } from './proposal.entity';
import { User } from './user.entity';

export type VoteType = 'For' | 'Against' | 'Abstain';

@Entity('votes')
@Index(['proposal', 'voter'], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proposal, (p) => p.votes, { onDelete: 'CASCADE' })
  proposal: Proposal;

  @ManyToOne(() => User, (u) => u.votes, { onDelete: 'CASCADE' })
  voter: User;

  @Column({
    type: 'enum',
    enum: ['For', 'Against', 'Abstain'],
  })
  vote: VoteType;

  @Column({ name: 'voting_power', type: 'numeric', precision: 38, scale: 18 })
  votingPower: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
