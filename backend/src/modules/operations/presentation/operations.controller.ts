import {
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import { OperationsService } from '../application/operations.service';

@RequireRoles(AppRole.SELLER)
@Controller('seller/orders')
export class SellerOrdersController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list(@CurrentUser() principal: SessionPrincipal) {
    return this.operations.sellerOrders(principal.userId);
  }

  @Post(':id/process')
  process(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.operations.processOrder(principal.userId, orderId);
  }
}

@RequireRoles(AppRole.DRIVER)
@Controller('driver')
export class DriverOperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('jobs')
  jobs(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.operations.jobs(limit, cursor);
  }

  @Post('jobs/:id/claim')
  claim(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) jobId: string,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.operations.claim(principal.userId, jobId, key);
  }

  @Post('deliveries/:id/pickup')
  pickup(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) deliveryId: string,
  ) {
    return this.operations.pickup(principal.userId, deliveryId);
  }

  @Post('deliveries/:id/complete')
  complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) deliveryId: string,
  ) {
    return this.operations.deliver(principal.userId, deliveryId);
  }

  @Get('earnings')
  earnings(@CurrentUser() principal: SessionPrincipal) {
    return this.operations.earnings(principal.userId);
  }
}

@RequireRoles(AppRole.BUYER)
@Controller('orders')
export class BuyerOrdersController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list(@CurrentUser() principal: SessionPrincipal) {
    return this.operations.buyerOrders(principal.userId);
  }

  @Get(':id')
  detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.operations.order(principal.userId, orderId);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.operations.confirm(principal.userId, orderId);
  }
}
