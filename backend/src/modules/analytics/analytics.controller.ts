import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApyHistoryService } from './apy-history.service';
import { ProtocolStatsService } from './protocol-stats.service';
import { TvlService } from './tvl.service';

@Controller()
export class AnalyticsController {
  constructor(
    private readonly tvlService: TvlService,
    private readonly apyHistoryService: ApyHistoryService,
    private readonly protocolStatsService: ProtocolStatsService,
  ) {}

  @Get('tvl')
  async getTvl() {
    return this.tvlService.getTotalValueLocked();
  }

  @Get('tvl/:assetCode')
  async getTvlByAsset(@Param('assetCode') assetCode: string) {
    return this.tvlService.getTvlByAsset(assetCode);
  }

  @Get('apy-history/:assetId')
  async getApyHistory(
    @Param('assetId') assetId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    return this.apyHistoryService.getApyHistory(assetId, startDate, endDate);
  }

  @Get('protocol-stats')
  async getProtocolStats() {
    return this.protocolStatsService.getGlobalStats();
  }

  @Get('user/:address')
  async getUserStats(@Param('address') address: string) {
    return this.protocolStatsService.getUserStats(address);
  }
}
