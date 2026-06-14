import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Proposal } from '../../database/entities/proposal.entity';
import { User } from '../../database/entities/user.entity';
import { Vote } from '../../database/entities/vote.entity';

import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Vote, User])],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
