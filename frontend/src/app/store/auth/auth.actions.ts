import { createAction, props } from '@ngrx/store';

export const connectWallet = createAction('[Auth] Connect Wallet');
export const connectWalletSuccess = createAction('[Auth] Connect Wallet Success', props<{ address: string }>());
export const connectWalletFailure = createAction('[Auth] Connect Wallet Failure', props<{ error: string }>());

export const login = createAction('[Auth] Login', props<{ address: string }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ address: string; jwt: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());
export const logout = createAction('[Auth] Logout');
