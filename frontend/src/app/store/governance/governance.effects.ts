import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { ProtocolApiService } from '../../core/services/protocol-api.service';
import * as GovernanceActions from './governance.actions';

@Injectable()
export class GovernanceEffects {
  loadProposals$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.loadProposals),
      switchMap(() =>
        this.api.getProposals().pipe(
          map((proposals) => GovernanceActions.loadProposalsSuccess({ proposals })),
          catchError((error: Error) => of(GovernanceActions.loadProposalsFailure({ error: error.message })))
        )
      )
    )
  );

  castVote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.castVote),
      switchMap(({ proposalId, voter, support }) =>
        this.api.vote(proposalId, voter, support).pipe(
          map((proposal) => GovernanceActions.castVoteSuccess({ proposal })),
          catchError((error: Error) => of(GovernanceActions.castVoteFailure({ error: error.message })))
        )
      )
    )
  );

  loadVotingPower$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.loadVotingPower),
      switchMap(({ address }) =>
        this.api.getVotingPower(address).pipe(
          map(({ votingPower }) => GovernanceActions.loadVotingPowerSuccess({ votingPower })),
          catchError(() => of(GovernanceActions.loadVotingPowerSuccess({ votingPower: '0' })))
        )
      )
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly api: ProtocolApiService
  ) {}
}
