import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        HOST: Joi.string().default('0.0.0.0'),

        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_NAME: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),

        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').default(''),

        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),

        STELLAR_NETWORK: Joi.string().valid('testnet', 'pubnet', 'local').default('testnet'),
        SOROBAN_RPC_URL: Joi.string().uri().optional(),

        CHALLENGE_TTL_SECONDS: Joi.number().default(300),
        CHALLENGE_PREFIX: Joi.string().default('sorolend:auth:challenge:'),
      }),
      validationOptions: { abortEarly: true },
    }),
  ],
})
export class ConfigModule {}
