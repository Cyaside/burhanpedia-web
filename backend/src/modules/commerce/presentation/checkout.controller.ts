import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import { CheckoutRequestDto } from '../application/checkout.dto';
import { CheckoutService } from '../application/checkout.service';

@RequireRoles(AppRole.BUYER)
@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout/quote')
  quote(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: CheckoutRequestDto,
  ) {
    return this.checkoutService.quote(principal.userId, dto);
  }

  @Post('checkouts')
  checkout(
    @CurrentUser() principal: SessionPrincipal,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CheckoutRequestDto,
  ) {
    return this.checkoutService.checkout(principal.userId, dto, idempotencyKey);
  }
}
