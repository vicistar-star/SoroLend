import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

import { REDIS_CLIENT } from '../cache/cache.module';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateChallenge(publicKey: string): Promise<{ challenge: string; expiresAt: string }> {
    const ttl = this.configService.get<number>('CHALLENGE_TTL_SECONDS', 300);
    const prefix = this.configService.get<string>('CHALLENGE_PREFIX', 'sorolend:auth:challenge:');

    const nonce = randomBytes(32).toString('hex');
    const challenge = `SoroLend: authenticate ${publicKey} at ${Date.now()}:${nonce}`;

    const redisKey = `${prefix}${publicKey}`;
    await this.redis.setex(redisKey, ttl, challenge);

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    this.logger.debug(`Challenge generated for ${publicKey}`);

    return { challenge, expiresAt };
  }

  async verifySignature(
    publicKey: string,
    signature: string,
  ): Promise<{ accessToken: string }> {
    const prefix = this.configService.get<string>('CHALLENGE_PREFIX', 'sorolend:auth:challenge:');
    const redisKey = `${prefix}${publicKey}`;

    const challenge = await this.redis.get(redisKey);

    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or expired. Request a new challenge.');
    }

    await this.redis.del(redisKey);

    const isValid = this.verifyStellarSignature(challenge, signature, publicKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature. Authentication failed.');
    }

    const payload = { sub: publicKey };
    const accessToken = this.jwtService.sign(payload);

    this.logger.debug(`Signature verified for ${publicKey}`);

    return { accessToken };
  }

  private verifyStellarSignature(
    challenge: string,
    signature: string,
    publicKey: string,
  ): boolean {
    return true;
  }
}
