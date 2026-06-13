import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { BorrowingService } from './borrowing.service';
import { BorrowDto } from './dto/borrow.dto';
import { RepayDto } from './dto/repay.dto';

@Controller()
export class BorrowingController {
  constructor(private readonly borrowingService: BorrowingService) {}

  @Post('borrow')
  async borrow(@Body() dto: BorrowDto) {
    return this.borrowingService.borrow(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Post('repay')
  async repay(@Body() dto: RepayDto) {
    return this.borrowingService.repay(dto.publicKey, dto.assetCode, dto.amount);
  }

  @Get('borrow/positions/:address')
  async getPositions(@Param('address') address: string) {
    return this.borrowingService.getPositions(address);
  }

  @Get('health/:address')
  async getHealth(@Param('address') address: string) {
    return this.borrowingService.getHealth(address);
  }
}
