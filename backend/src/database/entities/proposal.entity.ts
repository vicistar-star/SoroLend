import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vote } from './vote.entity';

export type ProposalStatus = 'Pending' | 'Active' | 'Succeeded' | 'Defeated' | 'Executed';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposal_id', type: 'integer' })
  @Index({ unique: true })
  proposalId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'proposer', type: 'varchar', length: 56 })
  proposer: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Active', 'Succeeded', 'Defeated', 'Executed'],
    default: 'Pending',
  })
  status: ProposalStatus;

  @Column({ name: 'for_votes', type: 'numeric', precision: 38, scale: 18, default: '0' })
  forVotes: string;

  @Column({ name: 'against_votes', type: 'numeric', precision: 38, scale: 18, default: '0' })
  againstVotes: string;

  @Column({ name: 'quorum', type: 'numeric', precision: 38, scale: 18 })
  quorum: string;

  @Column({ name: 'voting_power_snapshot', type: 'numeric', precision: 38, scale: 18, default: '0' })
  votingPowerSnapshot: string;

  @Column({ type: 'jsonb', nullable: true })
  targets: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  values: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  signatures: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  calldatas: string[] | null;

  @Column({ name: 'start_block', type: 'bigint', nullable: true })
  startBlock: number | null;

  @Column({ name: 'end_block', type: 'bigint', nullable: true })
  endBlock: number | null;

  @Column({ name: 'executed_at', type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Vote, (v) => v.proposal)
  votes: Vote[];
}
