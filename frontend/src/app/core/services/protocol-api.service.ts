import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CollateralPortfolio, Market, Position, Proposal, ProtocolStats } from '../models/protocol.models';

@Injectable({ providedIn: 'root' })
export class ProtocolApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getMarkets(): Observable<Market[]> {
    return this.http.get<Market[]>(`${this.apiUrl}/markets`);
  }

  getSupplyPositions(address: string): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.apiUrl}/positions/${address}`);
  }

  getBorrowPositions(address: string): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.apiUrl}/borrow/positions/${address}`);
  }

  getHealth(address: string): Observable<{ healthFactor: number }> {
    return this.http.get<{ healthFactor: number }>(`${this.apiUrl}/health/${address}`);
  }

  getCollateralPortfolio(address: string): Observable<CollateralPortfolio> {
    return this.http.get<CollateralPortfolio>(`${this.apiUrl}/collateral/portfolio/${address}`);
  }

  getMaxBorrow(address: string): Observable<{ availableBorrowUsd: number }> {
    return this.http.get<{ availableBorrowUsd: number }>(`${this.apiUrl}/collateral/max-borrow/${address}`);
  }

  supply(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/supply`, { publicKey, assetCode, amount });
  }

  withdraw(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/withdraw`, { publicKey, assetCode, amount });
  }

  borrow(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/borrow`, { publicKey, assetCode, amount });
  }

  repay(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/repay`, { publicKey, assetCode, amount });
  }

  depositCollateral(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/collateral/deposit`, { publicKey, assetCode, amount });
  }

  withdrawCollateral(publicKey: string, assetCode: string, amount: string): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/collateral/withdraw`, { publicKey, assetCode, amount });
  }

  getProposals(): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/proposals`);
  }

  vote(proposalId: string, voter: string, support: boolean): Observable<Proposal> {
    return this.http.post<Proposal>(`${this.apiUrl}/vote`, { proposalId, voter, support });
  }

  getVotingPower(address: string): Observable<{ votingPower: string }> {
    return this.http.get<{ votingPower: string }>(`${this.apiUrl}/voting-power/${address}`);
  }

  getProtocolStats(): Observable<ProtocolStats> {
    return this.http.get<ProtocolStats>(`${this.apiUrl}/protocol-stats`);
  }
}
