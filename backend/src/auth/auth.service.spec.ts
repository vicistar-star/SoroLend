import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../cache/cache.module';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let redis: jest.Mocked<Redis>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPublicKey = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(async () => {
    redis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    } as any;

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          CHALLENGE_TTL_SECONDS: 300,
          CHALLENGE_PREFIX: 'sorolend:auth:challenge:',
          JWT_EXPIRES_IN: '15m',
        };
        return config[key] ?? defaultValue;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('generateChallenge', () => {
    it('should store a challenge in Redis and return it', async () => {
      const result = await service.generateChallenge(mockPublicKey);

      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('expiresAt');
      expect(result.challenge).toContain(mockPublicKey);
      expect(result.challenge).toContain('SoroLend: authenticate');

      expect(redis.setex).toHaveBeenCalledWith(
        `sorolend:auth:challenge:${mockPublicKey}`,
        300,
        expect.any(String),
      );
    });

    it('should use configured TTL for Redis expiry', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'CHALLENGE_TTL_SECONDS') return 600;
        if (key === 'CHALLENGE_PREFIX') return 'sorolend:auth:challenge:';
        return defaultValue;
      });

      await service.generateChallenge(mockPublicKey);

      expect(redis.setex).toHaveBeenCalledWith(
        `sorolend:auth:challenge:${mockPublicKey}`,
        600,
        expect.any(String),
      );
    });
  });

  describe('verifySignature', () => {
    it('should reject when no challenge exists in Redis', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.verifySignature(mockPublicKey, 'some-signature'),
      ).rejects.toThrow('Challenge not found or expired');
    });

    it('should delete the challenge after verification attempt', async () => {
      redis.get.mockResolvedValue('SoroLend: authenticate GA... at 1234:abc');

      const result = await service.verifySignature(mockPublicKey, 'any-signature');

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(redis.del).toHaveBeenCalledWith(
        `sorolend:auth:challenge:${mockPublicKey}`,
      );
    });

    it('should return an access token on valid signature', async () => {
      redis.get.mockResolvedValue('SoroLend: authenticate GA... at 1234:abc');

      const result = await service.verifySignature(mockPublicKey, 'valid-signature');

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockPublicKey });
    });
  });
});
