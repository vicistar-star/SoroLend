import { createReducer, on } from '@ngrx/store';

import { WalletState } from '../../core/models/protocol.models';
import * as AuthActions from './auth.actions';

export interface AuthState extends WalletState {
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  address: localStorage.getItem('sorolend.address'),
  jwt: localStorage.getItem('sorolend.jwt'),
  connected: Boolean(localStorage.getItem('sorolend.address')),
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.connectWallet, AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.connectWalletSuccess, (state, { address }) => ({ ...state, address, connected: true, loading: false })),
  on(AuthActions.loginSuccess, (state, { address, jwt }) => ({
    ...state,
    address,
    jwt,
    connected: true,
    loading: false,
    error: null
  })),
  on(AuthActions.connectWalletFailure, AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AuthActions.logout, () => ({ ...initialAuthState, address: null, jwt: null, connected: false }))
);
