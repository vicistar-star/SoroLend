import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Lending & Borrowing (e2e)', () => {
  let app: INestApplication;
  let testPublicKey: string;

  beforeAll(async () => {
    testPublicKey = 'GDTEST' + Date.now();

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

  describe('LendingModule', () => {
    it('GET /api/v1/markets - should return list of markets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/markets')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/markets/UNKNOWN - should return 404 for unknown asset', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/markets/UNKNOWN')
        .expect(404);
    });

    it('POST /api/v1/supply - should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/supply')
        .send({})
        .expect(400);
    });

    it('POST /api/v1/supply - should reject invalid amount (non-numeric)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/supply')
        .send({ publicKey: testPublicKey, assetCode: 'USDC', amount: 'not-a-number' })
        .expect(400);
    });

    it('GET /api/v1/positions/:address - should return empty array for new user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/positions/${testPublicKey}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('BorrowingModule', () => {
    it('GET /api/v1/health/:address - should return health factor for any address', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/health/${testPublicKey}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('healthFactor');
      expect(response.body.data).toHaveProperty('totalCollateralUsd');
      expect(response.body.data).toHaveProperty('totalBorrowUsd');
    });

    it('POST /api/v1/borrow - should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/borrow')
        .send({})
        .expect(400);
    });

    it('POST /api/v1/repay - should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/repay')
        .send({})
        .expect(400);
    });

    it('GET /api/v1/borrow/positions/:address - should return empty array for new user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/borrow/positions/${testPublicKey}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('CollateralModule', () => {
    it('POST /api/v1/collateral/deposit - should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/collateral/deposit')
        .send({})
        .expect(400);
    });

    it('POST /api/v1/collateral/withdraw - should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/collateral/withdraw')
        .send({})
        .expect(400);
    });

    it('GET /api/v1/collateral/portfolio/:address - should return empty array for new user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/collateral/portfolio/${testPublicKey}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('GET /api/v1/collateral/max-borrow/:address - should return 0 for new user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/collateral/max-borrow/${testPublicKey}`)
        .expect(200);

      expect(response.body.data.maxBorrowUsd).toBe('0.000000000000000000');
    });
  });
});
