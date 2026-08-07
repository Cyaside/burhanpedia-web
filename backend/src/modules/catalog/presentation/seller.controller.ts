import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { Public } from '../../../common/security/public.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import {
  AdjustInventoryDto,
  CreateProductDto,
  CreateStoreDto,
  CreateVariantDto,
  UpdateProductDto,
} from '../application/seller.dto';
import { SellerProductsQueryDto } from '../application/seller-products-query.dto';
import { SellerService } from '../application/seller.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly sellers: SellerService) {}

  @RequireRoles(AppRole.SELLER)
  @Post()
  create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: CreateStoreDto,
  ) {
    return this.sellers.createStore(principal.userId, dto);
  }

  @Public()
  @Get(':slug')
  find(@Param('slug') slug: string) {
    return this.sellers.publicStore(slug);
  }
}

@RequireRoles(AppRole.SELLER)
@Controller('seller')
export class SellerCatalogController {
  constructor(private readonly sellers: SellerService) {}

  @Get('store')
  store(@CurrentUser() principal: SessionPrincipal) {
    return this.sellers.myStore(principal.userId);
  }

  @Get('products')
  products(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: SellerProductsQueryDto,
  ) {
    return this.sellers.myProducts(
      principal.userId,
      query.limit ?? 24,
      query.cursor,
    );
  }

  @Post('products')
  createProduct(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: CreateProductDto,
  ) {
    return this.sellers.createProduct(principal.userId, dto);
  }

  @Get('products/:id')
  product(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) productId: string,
  ) {
    return this.sellers.myProduct(principal.userId, productId);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.sellers.updateProduct(principal.userId, productId, dto);
  }

  @Post('products/:id/variants')
  addVariant(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.sellers.addVariant(principal.userId, productId, dto);
  }

  @Post('variants/:id/inventory/adjustments')
  adjustInventory(
    @CurrentUser() principal: SessionPrincipal,
    @Param('id', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.sellers.adjustInventory(principal.userId, variantId, dto);
  }
}
