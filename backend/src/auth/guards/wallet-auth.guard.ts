import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WalletAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const publicKey = request.headers['x-public-key'] as string;

    if (!publicKey || typeof publicKey !== 'string' || publicKey.length === 0) {
      return false;
    }

    request.user = { publicKey };
    return true;
  }
}
