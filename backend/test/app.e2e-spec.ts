import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/challenge - should return challenge for valid public key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/challenge')
      .send({ publicKey: 'GA...' })
      .expect(201);

    expect(response.body).toHaveProperty('challenge');
    expect(response.body).toHaveProperty('expiresAt');
  });

  it('POST /api/v1/auth/challenge - should reject empty public key', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/challenge')
      .send({ publicKey: '' })
      .expect(400);
  });

  it('POST /api/v1/auth/verify - should reject without challenge', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({ publicKey: 'GA...', signature: 'sig' })
      .expect(401);
  });
});
