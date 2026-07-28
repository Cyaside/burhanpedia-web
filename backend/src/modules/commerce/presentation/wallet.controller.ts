import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import {
  TopUpWalletDto,
  WalletHistoryQueryDto,
} from '../application/wallet.dto';
import { WalletService } from '../application/wallet.service';

@RequireRoles(AppRole.BUYER)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  find(@CurrentUser() principal: SessionPrincipal) {
    return this.wallet.wallet(principal.userId);
  }

  @Get('entries')
  history(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: WalletHistoryQueryDto,
  ) {
    return this.wallet.history(principal.userId, query);
  }

  @Post('top-ups')
  topUp(
    @CurrentUser() principal: SessionPrincipal,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: TopUpWalletDto,
  ) {
    return this.wallet.topUp(principal.userId, dto, key);
  }
}
