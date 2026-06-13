import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CollateralService } from './collateral.service';
import { DepositCollateralDto } from './dto/deposit-collateral.dto';
import { WithdrawCollateralDto } from './dto/withdraw-collateral.dto';

@Controller()
export class CollateralController {
  constructor(private readonly collateralService: CollateralService) {}

  @Post('collateral/deposit')
  async deposit(@Body() dto: DepositCollateralDto) {
    return this.collateralService.deposit(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Post('collateral/withdraw')
  async withdraw(@Body() dto: WithdrawCollateralDto) {
    return this.collateralService.withdraw(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Get('collateral/portfolio/:address')
  async getPortfolio(@Param('address') address: string) {
    return this.collateralService.getPortfolio(address);
  }

  @Get('collateral/max-borrow/:address')
  async getMaxBorrow(@Param('address') address: string) {
    return this.collateralService.getMaxBorrow(address);
  }
}
