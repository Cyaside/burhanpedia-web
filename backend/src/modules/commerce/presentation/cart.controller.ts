import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import {
  AddCartItemDto,
  CreateAddressDto,
  UpdateCartItemDto,
} from '../application/cart.dto';
import { CartService } from '../application/cart.service';

@RequireRoles(AppRole.BUYER)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  find(@CurrentUser() principal: SessionPrincipal) {
    return this.cart.cart(principal.userId);
  }

  @Post('items')
  add(@CurrentUser() principal: SessionPrincipal, @Body() dto: AddCartItemDto) {
    return this.cart.add(principal.userId, dto);
  }

  @Patch('items/:id')
  update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.update(principal.userId, itemId, dto);
  }

  @Delete('items/:id')
  @HttpCode(204)
  remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) itemId: string,
  ) {
    return this.cart.remove(principal.userId, itemId);
  }
}

@RequireRoles(AppRole.BUYER)
@Controller('addresses')
export class AddressController {
  constructor(private readonly cart: CartService) {}

  @Get()
  list(@CurrentUser() principal: SessionPrincipal) {
    return this.cart.addresses(principal.userId);
  }

  @Post()
  create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: CreateAddressDto,
  ) {
    return this.cart.createAddress(principal.userId, dto);
  }
}
