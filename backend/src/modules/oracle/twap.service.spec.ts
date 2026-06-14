import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PriceFeed } from '../../database/entities/price-feed.entity';

import { TwapService } from './twap.service';

describe('TwapService', () => {
  let service: TwapService;
  let priceFeedRepo: jest.Mocked<any>;

  const mockFeeds = [
    { id: '1', price: '100', timestamp: new Date('2024-01-01T00:00:00Z') },
    { id: '2', price: '102', timestamp: new Date('2024-01-01T00:01:00Z') },
    { id: '3', price: '101', timestamp: new Date('2024-01-01T00:02:00Z') },
    { id: '4', price: '103', timestamp: new Date('2024-01-01T00:03:00Z') },
    { id: '5', price: '104', timestamp: new Date('2024-01-01T00:04:00Z') },
    { id: '6', price: '105', timestamp: new Date('2024-01-01T00:05:00Z') },
    { id: '7', price: '106', timestamp: new Date('2024-01-01T00:06:00Z') },
    { id: '8', price: '107', timestamp: new Date('2024-01-01T00:07:00Z') },
    { id: '9', price: '108', timestamp: new Date('2024-01-01T00:08:00Z') },
    { id: '10', price: '110', timestamp: new Date('2024-01-01T00:09:00Z') },
  ] as PriceFeed[];

  beforeEach(async () => {
    priceFeedRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwapService,
        { provide: getRepositoryToken(PriceFeed), useValue: priceFeedRepo },
      ],
    }).compile();

    service = module.get<TwapService>(TwapService);
  });

  describe('calculateSimpleTwap', () => {
    it('should calculate simple average of last N prices', async () => {
      priceFeedRepo.find.mockResolvedValue(mockFeeds.slice(0, 5));

      const result = await service.calculateSimpleTwap('asset-1', 5);

      // (100 + 102 + 101 + 103 + 104) / 5 = 102
      expect(parseFloat(result)).toBeCloseTo(102, 2);
    });

    it('should return 0 when no feeds available', async () => {
      priceFeedRepo.find.mockResolvedValue([]);

      const result = await service.calculateSimpleTwap('asset-1', 10);
      expect(result).toBe('0');
    });

    it('should handle fewer feeds than requested periods', async () => {
      priceFeedRepo.find.mockResolvedValue(mockFeeds.slice(0, 3));

      const result = await service.calculateSimpleTwap('asset-1', 10);

      // (100 + 102 + 101) / 3 = 101
      expect(parseFloat(result)).toBeCloseTo(101, 2);
    });
  });

  describe('calculateTwap', () => {
    it('should calculate weighted average with linear decay', async () => {
      priceFeedRepo.find.mockResolvedValue(mockFeeds.slice(0, 4));

      const result = await service.calculateTwap('asset-1', 4);

      // Weights: 4, 3, 2, 1
      // (100*4 + 102*3 + 101*2 + 103*1) / (4+3+2+1) = (400+306+202+103)/10 = 1011/10 = 101.1
      expect(parseFloat(result)).toBeCloseTo(101.1, 2);
    });

    it('should return 0 when no feeds available', async () => {
      priceFeedRepo.find.mockResolvedValue([]);

      const result = await service.calculateTwap('asset-1', 10);
      expect(result).toBe('0');
    });
  });

  describe('calculateTwapWithThreshold', () => {
    it('should filter out outlier prices beyond deviation threshold', async () => {
      const feedsWithOutlier = [
        ...mockFeeds.slice(0, 5),
        { id: '100', price: '500', timestamp: new Date() },
      ] as PriceFeed[];

      priceFeedRepo.find.mockResolvedValue(feedsWithOutlier);

      const result = await service.calculateTwapWithThreshold('asset-1', 10, 0.5);

      // Mean of all: (100+102+101+103+104+500)/6 ≈ 168.33
      // 500 deviates by (500-168.33)/168.33 ≈ 1.97 which is > 0.5, so filtered out
      // Filtered: (100+102+101+103+104)/5 = 102
      expect(parseFloat(result)).toBeCloseTo(102, 0);
    });

    it('should return mean of all if all filtered out', async () => {
      priceFeedRepo.find.mockResolvedValue([{ id: '1', price: '100', timestamp: new Date() }]);

      const result = await service.calculateTwapWithThreshold('asset-1', 5, 0.01);
      expect(parseFloat(result)).toBeCloseTo(100, 2);
    });
  });
});
