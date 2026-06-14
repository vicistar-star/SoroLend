import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Asset } from '../../database/entities/asset.entity';
import { BorrowPosition } from '../../database/entities/borrow-position.entity';
import { SupplyPosition } from '../../database/entities/supply-position.entity';

import { TvlService } from './tvl.service';

describe('TvlService', () => {
  let service: TvlService;
  let supplyRepo: jest.Mocked<any>;
  let borrowRepo: jest.Mocked<any>;
  let assetRepo: jest.Mocked<any>;

  const mockAssets = [
    { id: 'a1', code: 'USDC', oraclePrice: '1.00', isActive: true },
    { id: 'a2', code: 'XLM', oraclePrice: '0.50', isActive: true },
    { id: 'a3', code: 'ETH', oraclePrice: '2000.00', isActive: true },
  ] as Asset[];

  beforeEach(async () => {
    supplyRepo = {
      find: jest.fn(),
    };

    borrowRepo = {
      find: jest.fn(),
    };

    assetRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TvlService,
        { provide: getRepositoryToken(SupplyPosition), useValue: supplyRepo },
        { provide: getRepositoryToken(BorrowPosition), useValue: borrowRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
      ],
    }).compile();

    service = module.get<TvlService>(TvlService);
  });

  describe('getTotalValueLocked', () => {
    it('should compute total TVL across all assets', async () => {
      assetRepo.find.mockResolvedValue(mockAssets);

      supplyRepo.find
        .mockResolvedValueOnce([
          { amount: '1000' },  // USDC supplies
          { amount: '2000' },
        ])
        .mockResolvedValueOnce([
          { amount: '5000' },  // XLM supplies
        ])
        .mockResolvedValueOnce([
          { amount: '10' },    // ETH supplies
        ]);

      const result = await service.getTotalValueLocked();

      // USDC: (1000+2000) * 1.00 = 3000
      // XLM: 5000 * 0.50 = 2500
      // ETH: 10 * 2000 = 20000
      // Total: 3000+2500+20000=25500
      expect(parseFloat(result.totalUsd)).toBeCloseTo(25500, 2);
      expect(result.byAsset).toHaveLength(3);

      const usdc = result.byAsset.find((a) => a.assetCode === 'USDC');
      expect(usdc).toBeDefined();
      expect(parseFloat(usdc!.usdValue)).toBeCloseTo(3000, 2);

      const eth = result.byAsset.find((a) => a.assetCode === 'ETH');
      expect(eth).toBeDefined();
      expect(parseFloat(eth!.usdValue)).toBeCloseTo(20000, 2);
    });

    it('should return zero TVL when no assets exist', async () => {
      assetRepo.find.mockResolvedValue([]);

      const result = await service.getTotalValueLocked();

      expect(result.totalUsd).toBe('0');
      expect(result.byAsset).toHaveLength(0);
    });

    it('should handle assets with zero oracle price', async () => {
      const assetsWithNoPrice = [
        { id: 'a1', code: 'UNKNOWN', oraclePrice: null, isActive: true },
      ] as Asset[];

      assetRepo.find.mockResolvedValue(assetsWithNoPrice);
      supplyRepo.find.mockResolvedValue([{ amount: '100' }]);

      const result = await service.getTotalValueLocked();

      expect(parseFloat(result.totalUsd)).toBeCloseTo(0, 2);
      expect(result.byAsset[0].usdValue).toBe('0');
    });
  });

  describe('getTvlByAsset', () => {
    it('should compute TVL for a specific asset', async () => {
      assetRepo.findOne.mockResolvedValue(mockAssets[0]);
      supplyRepo.find.mockResolvedValue([
        { amount: '1000' },
        { amount: '2000' },
      ]);
      borrowRepo.find.mockResolvedValue([
        { amount: '500' },
        { amount: '300' },
      ]);

      const result = await service.getTvlByAsset('USDC');

      expect(result.totalSupplied).toBe('3000');
      expect(result.totalBorrowed).toBe('800');
      expect(result.netTvl).toBe('2200');
    });

    it('should throw for unknown asset', async () => {
      assetRepo.findOne.mockResolvedValue(null);

      await expect(service.getTvlByAsset('NONEXISTENT')).rejects.toThrow(
        'Asset not found: NONEXISTENT',
      );
    });

    it('should handle asset with no positions', async () => {
      assetRepo.findOne.mockResolvedValue(mockAssets[0]);
      supplyRepo.find.mockResolvedValue([]);
      borrowRepo.find.mockResolvedValue([]);

      const result = await service.getTvlByAsset('USDC');

      expect(result.totalSupplied).toBe('0');
      expect(result.totalBorrowed).toBe('0');
      expect(result.netTvl).toBe('0');
    });
  });
});
