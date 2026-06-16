import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { WalletService } from './wallet.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const wallet = { signMessage: jest.fn().mockResolvedValue('signature') };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: WalletService, useValue: wallet }]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    jest.clearAllMocks();
  });

  it('completes challenge and verify flow', fakeAsync(() => {
    let authResult: { publicKey: string; jwt: string } | undefined;
    service.login('GABC').subscribe((result) => (authResult = result));

    http.expectOne(`${environment.apiUrl}/auth/challenge`).flush({ nonce: 'nonce-1' });
    tick();
    http.expectOne(`${environment.apiUrl}/auth/verify`).flush({ accessToken: 'jwt-token' });
    tick();

    expect(authResult).toEqual({ publicKey: 'GABC', jwt: 'jwt-token' });
    expect(wallet.signMessage).toHaveBeenCalledWith('nonce-1');
  }));

  it('refreshes token by repeating wallet auth', fakeAsync(() => {
    let jwt = '';
    service.refreshToken('GABC').subscribe((result) => (jwt = result.jwt));

    http.expectOne(`${environment.apiUrl}/auth/challenge`).flush({ challenge: 'refresh-nonce' });
    tick();
    http.expectOne(`${environment.apiUrl}/auth/verify`).flush({ token: 'jwt-refresh' });
    tick();

    expect(jwt).toBe('jwt-refresh');
  }));
});
