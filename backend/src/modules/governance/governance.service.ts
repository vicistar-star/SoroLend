import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Proposal, ProposalStatus } from '../../database/entities/proposal.entity';
import { User } from '../../database/entities/user.entity';
import { Vote, VoteType } from '../../database/entities/vote.entity';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createProposal(params: {
    title: string;
    description: string;
    proposer: string;
    quorum: string;
    targets?: string[];
    values?: string[];
    signatures?: string[];
    calldatas?: string[];
  }): Promise<Proposal> {
    const proposer = await this.findOrCreateUser(params.proposer);

    const maxId = await this.proposalRepo
      .createQueryBuilder('p')
      .select('MAX(p.proposalId)', 'max')
      .getRawOne();

    const nextId = (maxId?.max ?? 0) + 1;

    const proposal = this.proposalRepo.create({
      proposalId: nextId,
      title: params.title,
      description: params.description,
      proposer: params.proposer,
      status: 'Pending',
      forVotes: '0',
      againstVotes: '0',
      quorum: params.quorum,
      votingPowerSnapshot: '0',
      targets: params.targets || null,
      values: params.values || null,
      signatures: params.signatures || null,
      calldatas: params.calldatas || null,
    });

    this.logger.debug(`[STUB] Soroban create proposal: id=${nextId}, title=${params.title}`);

    return this.proposalRepo.save(proposal);
  }

  async getProposals(): Promise<Proposal[]> {
    return this.proposalRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['votes'],
    });
  }

  async getProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepo.findOne({
      where: { id },
      relations: ['votes'],
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${id}`);
    }

    return proposal;
  }

  async castVote(params: {
    proposalId: string;
    voter: string;
    vote: VoteType;
    reason?: string;
  }): Promise<Vote> {
    const proposal = await this.proposalRepo.findOne({ where: { id: params.proposalId } });
    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${params.proposalId}`);
    }

    if (proposal.status !== 'Active') {
      throw new BadRequestException('Voting is not active for this proposal');
    }

    const voter = await this.findOrCreateUser(params.voter);

    const existingVote = await this.voteRepo.findOne({
      where: { proposal: { id: proposal.id }, voter: { id: voter.id } },
    });

    if (existingVote) {
      throw new BadRequestException('Voter has already cast a vote on this proposal');
    }

    const votingPower = await this.getVotingPower(params.voter);

    const vote = this.voteRepo.create({
      proposal,
      voter,
      vote: params.vote,
      votingPower,
      reason: params.reason || null,
    });

    this.logger.debug(
      `[STUB] Soroban cast vote: proposal=${params.proposalId}, voter=${params.voter}, vote=${params.vote}, power=${votingPower}`,
    );

    const saved = await this.voteRepo.save(vote);
    await this.updateTally(proposal.id);

    return saved;
  }

  async getVotingPower(address: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { publicKey: address } });
    if (!user) {
      return '0';
    }

    const supplyCount = user.supplyPositions?.length || 0;
    const simulatedPower = Math.max(supplyCount * 100, 1).toString();
    this.logger.debug(`[STUB] Voting power for ${address}: ${simulatedPower}`);
    return simulatedPower;
  }

  async activateProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${id}`);
    }

    if (proposal.status !== 'Pending') {
      throw new BadRequestException('Only Pending proposals can be activated');
    }

    proposal.status = 'Active';
    return this.proposalRepo.save(proposal);
  }

  async executeProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${id}`);
    }

    if (proposal.status !== 'Succeeded') {
      throw new BadRequestException('Only Succeeded proposals can be executed');
    }

    proposal.status = 'Executed';
    proposal.executedAt = new Date();
    this.logger.debug(`[STUB] Soroban execute proposal: id=${proposal.proposalId}`);

    return this.proposalRepo.save(proposal);
  }

  async finalizeProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${id}`);
    }

    if (proposal.status !== 'Active') {
      throw new BadRequestException('Only Active proposals can be finalized');
    }

    await this.updateTally(proposal.id);

    const refreshed = await this.proposalRepo.findOne({ where: { id } });
    if (!refreshed) {
      throw new NotFoundException(`Proposal not found: ${id}`);
    }

    const quorumMet = await this.checkQuorum(refreshed);
    const forVotes = parseFloat(refreshed.forVotes);
    const againstVotes = parseFloat(refreshed.againstVotes);

    if (quorumMet && forVotes > againstVotes) {
      refreshed.status = 'Succeeded';
    } else {
      refreshed.status = 'Defeated';
    }

    return this.proposalRepo.save(refreshed);
  }

  private async updateTally(proposalId: string): Promise<void> {
    const votes = await this.voteRepo.find({
      where: { proposal: { id: proposalId } },
    });

    let forVotes = BigInt(0);
    let againstVotes = BigInt(0);

    for (const vote of votes) {
      if (vote.vote === 'For') {
        forVotes += BigInt(vote.votingPower);
      } else if (vote.vote === 'Against') {
        againstVotes += BigInt(vote.votingPower);
      }
    }

    await this.proposalRepo.update(proposalId, {
      forVotes: forVotes.toString(),
      againstVotes: againstVotes.toString(),
    });
  }

  private async checkQuorum(proposal: Proposal): Promise<boolean> {
    const totalVotes = parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes);
    return totalVotes >= parseFloat(proposal.quorum);
  }

  private async findOrCreateUser(publicKey: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { publicKey } });
    if (!user) {
      user = this.userRepo.create({ publicKey });
      user = await this.userRepo.save(user);
    }
    return user;
  }
}
