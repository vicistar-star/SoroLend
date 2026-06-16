import { TestBed } from '@angular/core/testing';

import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletService);
    delete window.freighterApi;
  });

  it('connects through Freighter and returns the public key', async () => {
    window.freighterApi = {
      isConnected: jest.fn().mockResolvedValue(true),
      getPublicKey: jest.fn().mockResolvedValue('GABC123'),
      signMessage: jest.fn(),
      signTransaction: jest.fn()
    };

    await expect(service.connect()).resolves.toBe('GABC123');
    expect(window.freighterApi.isConnected).toHaveBeenCalled();
    expect(window.freighterApi.getPublicKey).toHaveBeenCalled();
  });

  it('surfaces a clear error when Freighter is unavailable', async () => {
    await expect(service.connect()).rejects.toThrow('Install Freighter');
  });

  it('signs messages through Freighter', async () => {
    window.freighterApi = {
      isConnected: jest.fn(),
      getPublicKey: jest.fn(),
      signMessage: jest.fn().mockResolvedValue('signed'),
      signTransaction: jest.fn()
    };

    await expect(service.signMessage('nonce')).resolves.toBe('signed');
    expect(window.freighterApi.signMessage).toHaveBeenCalledWith('nonce');
  });
});
