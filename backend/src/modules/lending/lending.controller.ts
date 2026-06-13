import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { SupplyDto } from './dto/supply.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { LendingService } from './lending.service';

@Controller()
export class LendingController {
  constructor(private readonly lendingService: LendingService) {}

  @Get('markets')
  async getMarkets() {
    return this.lendingService.getMarkets();
  }

  @Get('markets/:assetCode')
  async getMarket(@Param('assetCode') assetCode: string) {
    return this.lendingService.getMarket(assetCode);
  }

  @Post('supply')
  async supply(@Body() dto: SupplyDto) {
    return this.lendingService.supply(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Post('withdraw')
  async withdraw(@Body() dto: WithdrawDto) {
    return this.lendingService.withdraw(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Get('positions/:address')
  async getPositions(@Param('address') address: string) {
    return this.lendingService.getPositions(address);
  }
}
