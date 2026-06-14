import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { CollateralPosition } from '../../database/entities/collateral-position.entity';
import { LiquidationEvent } from '../../database/entities/liquidation-event.entity';
import { User } from '../../database/entities/user.entity';

import { LiquidationService } from './liquidation.service';

describe('LiquidationService', () => {
  let service: LiquidationService;
  let userRepo: jest.Mocked<any>;
  let collateralRepo: jest.Mocked<any>;
  let borrowRepo: jest.Mocked<any>;

  const mockUsers = [
    { id: 'u1', publicKey: 'GA...1' },
    { id: 'u2', publicKey: 'GA...2' },
  ] as User[];

  const mockAssets = [
    {
      id: 'a1',
      code: 'USDC',
      oraclePrice: '1.00',
      liquidationThreshold: '0.80',
      liquidationPenalty: '0.05',
      isActive: true,
      decimals: 7,
    },
    {
      id: 'a2',
      code: 'XLM',
      oraclePrice: '0.50',
      liquidationThreshold: '0.75',
      liquidationPenalty: '0.08',
      isActive: true,
      decimals: 7,
    },
  ] as Asset[];

  const mockCollateralPositions = [
    {
      id: 'c1',
      user: { id: 'u1', publicKey: 'GA...1' } as User,
      asset: mockAssets[0],
      amount: '1000',
    },
    {
      id: 'c2',
      user: { id: 'u2', publicKey: 'GA...2' } as User,
      asset: mockAssets[0],
      amount: '500',
    },
  ] as CollateralPosition[];

  const mockBorrowPositions = [
    {
      id: 'b1',
      user: { id: 'u1', publicKey: 'GA...1' } as User,
      asset: mockAssets[1],
      amount: '2000',
      interestIndex: '1000000000000000000',
      accruedInterest: '0',
    },
    {
      id: 'b2',
      user: { id: 'u2', publicKey: 'GA...2' } as User,
      asset: mockAssets[1],
      amount: '100',
      interestIndex: '1000000000000000000',
      accruedInterest: '0',
    },
  ] as BorrowPosition[];

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    collateralRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    borrowRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const liquidationEventRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const assetRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiquidationService,
        { provide: getRepositoryToken(LiquidationEvent), useValue: liquidationEventRepo },
        { provide: getRepositoryToken(BorrowPosition), useValue: borrowRepo },
        { provide: getRepositoryToken(CollateralPosition), useValue: collateralRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<LiquidationService>(LiquidationService);
  });

  describe('getAtRiskPositions', () => {
    it('should return positions with health factor below 1.05 buffer', async () => {
      userRepo.find.mockResolvedValue(mockUsers);
      collateralRepo.find
        .mockResolvedValueOnce([mockCollateralPositions[0]])
        .mockResolvedValueOnce([mockCollateralPositions[1]]);
      borrowRepo.find
        .mockResolvedValueOnce([mockBorrowPositions[0]])
        .mockResolvedValueOnce([mockBorrowPositions[1]]);

      const atRisk = await service.getAtRiskPositions();

      // User 1: collateral=1000*1.00*0.80=800, borrow=2000*0.50=1000, HF=0.8 -> at risk
      // User 2: collateral=500*1.00*0.80=400, borrow=100*0.50=50, HF=8.0 -> not at risk
      expect(atRisk).toHaveLength(1);
      expect(atRisk[0].publicKey).toBe('GA...1');
      expect(atRisk[0].healthFactor).toBeCloseTo(0.8, 2);
    });

    it('should return empty array when no users have debt', async () => {
      userRepo.find.mockResolvedValue(mockUsers);
      collateralRepo.find
        .mockResolvedValueOnce([mockCollateralPositions[0]])
        .mockResolvedValueOnce([mockCollateralPositions[1]]);
      borrowRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const atRisk = await service.getAtRiskPositions();

      expect(atRisk).toHaveLength(0);
    });

    it('should skip users with no borrow positions', async () => {
      userRepo.find.mockResolvedValue(mockUsers);
      collateralRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      borrowRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const atRisk = await service.getAtRiskPositions();
      expect(atRisk).toHaveLength(0);
    });
  });

  describe('computeHealthFactor', () => {
    it('should compute health factor correctly for a healthy position', async () => {
      const user = mockUsers[0];
      collateralRepo.find.mockResolvedValue([mockCollateralPositions[0]]);
      borrowRepo.find.mockResolvedValue([mockBorrowPositions[1]]);

      const result = await service.computeHealthFactor(user.id);

      expect(result).not.toBeNull();
      if (result) {
        // collateral: 1000 * 1.00 * 0.80 = 800
        // borrow: 100 * 0.50 = 50
        // HF: 800/50 = 16
        expect(result.healthFactor).toBeCloseTo(16, 2);
      }
    });

    it('should return null if user has no borrow positions', async () => {
      collateralRepo.find.mockResolvedValue([mockCollateralPositions[0]]);
      borrowRepo.find.mockResolvedValue([]);

      const result = await service.computeHealthFactor('u1');
      expect(result).toBeNull();
    });
  });
});
