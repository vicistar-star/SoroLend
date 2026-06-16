import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StellarService {
  async invokeContract(method: string, args: unknown[]): Promise<{ xdr: string; method: string; args: unknown[] }> {
    return {
      method,
      args,
      xdr: `STUB_${method.toUpperCase()}_${Date.now()}`
    };
  }

  async simulateTransaction(xdr: string): Promise<{ fee: string; result: string }> {
    return {
      fee: '100',
      result: `SIMULATED_${xdr}`
    };
  }
}
