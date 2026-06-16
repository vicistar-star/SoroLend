import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { selectWalletAddress } from '../../store/auth/auth.selectors';
import * as GovernanceActions from '../../store/governance/governance.actions';
import { selectGovernanceError, selectGovernanceLoading, selectProposals, selectVotingPower } from '../../store/governance/governance.selectors';

@Component({
  selector: 'sl-governance',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Governance</h1>
          <p class="muted">Vote on protocol proposals with your SoroLend voting power.</p>
        </div>
        <strong>Voting power {{ (votingPower$ | async) ?? '0' | number }}</strong>
      </div>

      @if (loading$ | async) {
        <p class="muted">Loading governance data...</p>
      }

      @for (proposal of proposals$ | async; track proposal.id) {
        <article class="panel">
          <div class="proposal-row">
            <div>
              <h2>{{ proposal.title }}</h2>
              <p class="muted">{{ proposal.status }}</p>
            </div>
            <div>
              <button type="button" (click)="vote(proposal.id, true)">For</button>
              <button type="button" (click)="vote(proposal.id, false)">Against</button>
            </div>
          </div>
          <p>{{ proposal.description }}</p>
          <div class="metric">
            <span>For {{ proposal.forVotes | number }}</span>
            <span>Against {{ proposal.againstVotes | number }}</span>
          </div>
        </article>
      } @empty {
        <article class="panel muted">No proposals available</article>
      }

      @if (error$ | async; as error) {
        <p class="inline-error">{{ error }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GovernanceComponent implements OnInit {
  readonly proposals$ = this.store.select(selectProposals);
  readonly votingPower$ = this.store.select(selectVotingPower);
  readonly loading$ = this.store.select(selectGovernanceLoading);
  readonly error$ = this.store.select(selectGovernanceError);
  private currentAddress: string | null = null;

  constructor(private readonly store: Store) {
    this.store.select(selectWalletAddress).subscribe((address) => {
      this.currentAddress = address;
      if (address) {
        this.store.dispatch(GovernanceActions.loadVotingPower({ address }));
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(GovernanceActions.loadProposals());
  }

  vote(proposalId: string, support: boolean): void {
    if (!this.currentAddress) {
      return;
    }
    this.store.dispatch(GovernanceActions.castVote({ proposalId, voter: this.currentAddress, support }));
  }
}
