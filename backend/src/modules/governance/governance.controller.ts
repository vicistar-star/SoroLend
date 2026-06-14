import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateProposalDto } from './dto/create-proposal.dto';
import { VoteDto } from './dto/vote.dto';
import { GovernanceService } from './governance.service';

@Controller()
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('proposals')
  async getProposals() {
    return this.governanceService.getProposals();
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') id: string) {
    return this.governanceService.getProposal(id);
  }

  @Post('proposals')
  async createProposal(@Body() dto: CreateProposalDto) {
    return this.governanceService.createProposal(dto);
  }

  @Post('vote')
  async castVote(@Body() dto: VoteDto) {
    return this.governanceService.castVote(dto);
  }

  @Get('voting-power/:address')
  async getVotingPower(@Param('address') address: string) {
    return this.governanceService.getVotingPower(address);
  }

  @Post('proposals/:id/activate')
  async activateProposal(@Param('id') id: string) {
    return this.governanceService.activateProposal(id);
  }

  @Post('proposals/:id/finalize')
  async finalizeProposal(@Param('id') id: string) {
    return this.governanceService.finalizeProposal(id);
  }

  @Post('proposals/:id/execute')
  async executeProposal(@Param('id') id: string) {
    return this.governanceService.executeProposal(id);
  }
}
