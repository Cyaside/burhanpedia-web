import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import type { RequestWithUser } from '../auth/types/jwt.types';
import { TopUpDto } from './dto/wallet.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('topup')
  topUp(@Request() req: RequestWithUser, @Body() body: TopUpDto) {
    return this.walletService.topUp(req.user.id, body.amount, body.note);
  }

  @Get('transactions')
  list(@Request() req: RequestWithUser) {
    return this.walletService.listTransactions(req.user.id);
  }
}
