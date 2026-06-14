import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Proposal } from '../../database/entities/proposal.entity';
import { User } from '../../database/entities/user.entity';
import { Vote } from '../../database/entities/vote.entity';

import { GovernanceService } from './governance.service';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let proposalRepo: jest.Mocked<any>;
  let voteRepo: jest.Mocked<any>;
  let userRepo: jest.Mocked<any>;

  beforeEach(async () => {
    proposalRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    voteRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      save: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        { provide: getRepositoryToken(Proposal), useValue: proposalRepo },
        { provide: getRepositoryToken(Vote), useValue: voteRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  describe('createProposal', () => {
    it('should create a proposal with next sequential ID', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', publicKey: 'GA...creator' });

      proposalRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
      });

      proposalRepo.create.mockReturnValue({
        proposalId: 6,
        title: 'Test Proposal',
        status: 'Pending',
      });
      proposalRepo.save.mockResolvedValue({
        proposalId: 6,
        title: 'Test Proposal',
        status: 'Pending',
      });

      const result = await service.createProposal({
        title: 'Test Proposal',
        description: 'A test proposal',
        proposer: 'GA...creator',
        quorum: '1000',
      });

      expect(result.proposalId).toBe(6);
      expect(result.status).toBe('Pending');
    });

    it('should start with ID 1 when no proposals exist', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', publicKey: 'GA...creator' });

      proposalRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      });
      proposalRepo.create.mockReturnValue({
        proposalId: 1,
        title: 'First Proposal',
        status: 'Pending',
      });
      proposalRepo.save.mockResolvedValue({
        proposalId: 1,
        title: 'First Proposal',
        status: 'Pending',
      });

      const result = await service.createProposal({
        title: 'First Proposal',
        description: 'First proposal',
        proposer: 'GA...creator',
        quorum: '500',
      });

      expect(result.proposalId).toBe(1);
    });
  });

  describe('castVote', () => {
    it('should reject vote if proposal is not active', async () => {
      proposalRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: 'Pending',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      });
      userRepo.findOne.mockResolvedValue({ id: 'u1', publicKey: 'GA...voter' });

      await expect(
        service.castVote({
          proposalId: 'p1',
          voter: 'GA...voter',
          vote: 'For' as any,
        }),
      ).rejects.toThrow('Voting is not active for this proposal');
    });

    it('should reject duplicate votes from same voter', async () => {
      proposalRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: 'Active',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      });
      userRepo.findOne.mockResolvedValue({ id: 'u1', publicKey: 'GA...voter' });
      voteRepo.findOne.mockResolvedValue({ id: 'v1' });

      await expect(
        service.castVote({
          proposalId: 'p1',
          voter: 'GA...voter',
          vote: 'For' as any,
        }),
      ).rejects.toThrow('Voter has already cast a vote on this proposal');
    });

    it('should allow voting on active proposals', async () => {
      proposalRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: 'Active',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      });
      userRepo.findOne.mockResolvedValue({ id: 'u1', publicKey: 'GA...voter' });
      voteRepo.findOne.mockResolvedValue(null);
      voteRepo.find.mockResolvedValue([]);
      voteRepo.create.mockReturnValue({
        id: 'v1',
        proposal: { id: 'p1' },
        voter: { id: 'u1' },
        vote: 'For',
        votingPower: '100',
      });
      voteRepo.save.mockResolvedValue({
        id: 'v1',
        vote: 'For',
        votingPower: '100',
      });

      const result = await service.castVote({
        proposalId: 'p1',
        voter: 'GA...voter',
        vote: 'For' as any,
      });

      expect(result.vote).toBe('For');
      expect(result.votingPower).toBe('100');
    });
  });

  describe('finalizeProposal - quorum math', () => {
    it('should succeed when forVotes > againstVotes and quorum met', async () => {
      const proposal = {
        id: 'p1',
        status: 'Active',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      };

      proposalRepo.findOne.mockResolvedValueOnce(proposal);

      voteRepo.find.mockResolvedValue([
        { vote: 'For' as any, votingPower: '1000' },
        { vote: 'For' as any, votingPower: '500' },
        { vote: 'Against' as any, votingPower: '500' },
      ]);

      proposalRepo.update.mockResolvedValue({ affected: 1 });

      const updatedProposal = {
        ...proposal,
        forVotes: '1500',
        againstVotes: '500',
      };
      proposalRepo.findOne.mockResolvedValueOnce(updatedProposal);
      proposalRepo.save.mockResolvedValue({
        ...updatedProposal,
        status: 'Succeeded',
      });

      const result = await service.finalizeProposal('p1');

      expect(result.status).toBe('Succeeded');
    });

    it('should defeat when forVotes <= againstVotes even if quorum met', async () => {
      const proposal = {
        id: 'p2',
        status: 'Active',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      };

      proposalRepo.findOne.mockResolvedValueOnce(proposal);

      voteRepo.find.mockResolvedValue([
        { vote: 'For' as any, votingPower: '400' },
        { vote: 'Against' as any, votingPower: '600' },
      ]);

      proposalRepo.update.mockResolvedValue({ affected: 1 });

      const updatedProposal = {
        ...proposal,
        forVotes: '400',
        againstVotes: '600',
      };
      proposalRepo.findOne.mockResolvedValueOnce(updatedProposal);
      proposalRepo.save.mockResolvedValue({
        ...updatedProposal,
        status: 'Defeated',
      });

      const result = await service.finalizeProposal('p2');

      expect(result.status).toBe('Defeated');
    });

    it('should defeat when quorum not met even if forVotes > againstVotes', async () => {
      const proposal = {
        id: 'p3',
        status: 'Active',
        forVotes: '0',
        againstVotes: '0',
        quorum: '1000',
      };

      proposalRepo.findOne.mockResolvedValueOnce(proposal);

      voteRepo.find.mockResolvedValue([
        { vote: 'For' as any, votingPower: '600' },
        { vote: 'Against' as any, votingPower: '100' },
      ]);

      proposalRepo.update.mockResolvedValue({ affected: 1 });

      const updatedProposal = {
        ...proposal,
        forVotes: '600',
        againstVotes: '100',
      };
      proposalRepo.findOne.mockResolvedValueOnce(updatedProposal);
      proposalRepo.save.mockResolvedValue({
        ...updatedProposal,
        status: 'Defeated',
      });

      const result = await service.finalizeProposal('p3');

      expect(result.status).toBe('Defeated');
    });

    it('should not allow finalizing a non-active proposal', async () => {
      proposalRepo.findOne.mockResolvedValue({
        id: 'p4',
        status: 'Pending',
      });

      await expect(service.finalizeProposal('p4')).rejects.toThrow(
        'Only Active proposals can be finalized',
      );
    });
  });

  describe('getVotingPower', () => {
    it('should return 0 for unknown addresses', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.getVotingPower('GA...unknown');
      expect(result).toBe('0');
    });

    it('should return positive voting power for existing users', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        publicKey: 'GA...known',
        supplyPositions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      });

      const result = await service.getVotingPower('GA...known');
      expect(parseInt(result, 10)).toBeGreaterThan(0);
    });
  });
});
