import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SellerService } from './seller.service';
import type { RequestWithUser } from '../auth/types/jwt.types';

@UseGuards(JwtAuthGuard)
@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('orders')
  listOrders(@Request() req: RequestWithUser) {
    return this.sellerService.listOrders(req.user.id);
  }

  @Get('transactions')
  listTransactions(@Request() req: RequestWithUser) {
    return this.sellerService.listTransactions(req.user.id);
  }

  @Get('balance')
  getBalance(@Request() req: RequestWithUser) {
    return this.sellerService.getBalance(req.user.id);
  }
}
