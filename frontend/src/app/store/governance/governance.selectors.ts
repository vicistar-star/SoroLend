import { createFeatureSelector, createSelector } from '@ngrx/store';

import { GovernanceState } from './governance.reducer';

export const selectGovernanceState = createFeatureSelector<GovernanceState>('governance');
export const selectProposals = createSelector(selectGovernanceState, (state) => state.proposals);
export const selectVotingPower = createSelector(selectGovernanceState, (state) => state.votingPower);
export const selectGovernanceLoading = createSelector(selectGovernanceState, (state) => state.loading);
export const selectGovernanceError = createSelector(selectGovernanceState, (state) => state.error);
