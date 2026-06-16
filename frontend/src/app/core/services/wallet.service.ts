import { Injectable } from '@angular/core';

type FreighterApi = {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signMessage?: (message: string, options?: { networkPassphrase?: string }) => Promise<string>;
  signTransaction?: (xdr: string, options?: { networkPassphrase?: string }) => Promise<string>;
};

declare global {
  interface Window {
    freighterApi?: FreighterApi;
  }
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  async connect(): Promise<string> {
    const api = this.getFreighter();
    const connected = await api.isConnected();
    if (!connected) {
      throw new Error('Freighter wallet is not connected');
    }
    return api.getPublicKey();
  }

  async signMessage(message: string): Promise<string> {
    const api = this.getFreighter();
    if (!api.signMessage) {
      throw new Error('Freighter signMessage is unavailable');
    }
    return api.signMessage(message);
  }

  async signTransaction(xdr: string): Promise<string> {
    const api = this.getFreighter();
    if (!api.signTransaction) {
      throw new Error('Freighter signTransaction is unavailable');
    }
    return api.signTransaction(xdr);
  }

  private getFreighter(): FreighterApi {
    if (!window.freighterApi) {
      throw new Error('Install Freighter to connect a Stellar wallet');
    }
    return window.freighterApi;
  }
}
