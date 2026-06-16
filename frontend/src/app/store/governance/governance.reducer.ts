import { createReducer, on } from '@ngrx/store';

import { Proposal } from '../../core/models/protocol.models';
import * as GovernanceActions from './governance.actions';

export interface GovernanceState {
  proposals: Proposal[];
  votingPower: string;
  loading: boolean;
  error: string | null;
}

export const initialGovernanceState: GovernanceState = {
  proposals: [],
  votingPower: '0',
  loading: false,
  error: null
};

export const governanceReducer = createReducer(
  initialGovernanceState,
  on(GovernanceActions.loadProposals, GovernanceActions.castVote, GovernanceActions.loadVotingPower, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(GovernanceActions.loadProposalsSuccess, (state, { proposals }) => ({ ...state, proposals, loading: false })),
  on(GovernanceActions.castVoteSuccess, (state, { proposal }) => ({
    ...state,
    proposals: state.proposals.map((item) => (item.id === proposal.id ? proposal : item)),
    loading: false
  })),
  on(GovernanceActions.loadVotingPowerSuccess, (state, { votingPower }) => ({ ...state, votingPower, loading: false })),
  on(GovernanceActions.loadProposalsFailure, GovernanceActions.castVoteFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
);
