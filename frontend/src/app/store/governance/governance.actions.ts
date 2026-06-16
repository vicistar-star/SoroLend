import { createAction, props } from '@ngrx/store';

import { Proposal } from '../../core/models/protocol.models';

export const loadProposals = createAction('[Governance] Load Proposals');
export const loadProposalsSuccess = createAction('[Governance] Load Proposals Success', props<{ proposals: Proposal[] }>());
export const loadProposalsFailure = createAction('[Governance] Load Proposals Failure', props<{ error: string }>());

export const castVote = createAction('[Governance] Cast Vote', props<{ proposalId: string; voter: string; support: boolean }>());
export const castVoteSuccess = createAction('[Governance] Cast Vote Success', props<{ proposal: Proposal }>());
export const castVoteFailure = createAction('[Governance] Cast Vote Failure', props<{ error: string }>());

export const loadVotingPower = createAction('[Governance] Load Voting Power', props<{ address: string }>());
export const loadVotingPowerSuccess = createAction('[Governance] Load Voting Power Success', props<{ votingPower: string }>());
