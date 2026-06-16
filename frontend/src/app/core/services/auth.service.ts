import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { WalletService } from './wallet.service';

interface ChallengeResponse {
  nonce?: string;
  challenge?: string;
  message?: string;
}

interface VerifyResponse {
  accessToken?: string;
  token?: string;
  jwt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly wallet: WalletService
  ) {}

  login(publicKey: string): Observable<{ publicKey: string; jwt: string }> {
    return this.http.post<ChallengeResponse>(`${this.apiUrl}/auth/challenge`, { publicKey }).pipe(
      switchMap((challenge) => {
        const message = challenge.challenge ?? challenge.message ?? challenge.nonce ?? '';
        return from(this.wallet.signMessage(message)).pipe(map((signature) => ({ signature })));
      }),
      switchMap(({ signature }) =>
        this.http.post<VerifyResponse>(`${this.apiUrl}/auth/verify`, { publicKey, signature })
      ),
      map((response) => ({
        publicKey,
        jwt: response.accessToken ?? response.token ?? response.jwt ?? ''
      }))
    );
  }

  refreshToken(publicKey: string): Observable<{ publicKey: string; jwt: string }> {
    return this.login(publicKey);
  }
}
