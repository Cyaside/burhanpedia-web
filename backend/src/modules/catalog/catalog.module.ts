import { Module } from '@nestjs/common';
import { CatalogService } from './application/catalog.service';
import { CatalogRepository } from './infrastructure/catalog.repository';
import { SellerRepository } from './infrastructure/seller.repository';
import { SellerService } from './application/seller.service';
import {
  SellerCatalogController,
  StoresController,
} from './presentation/seller.controller';
import {
  CatalogController,
  CategoriesController,
} from './presentation/catalog.controller';

@Module({
  controllers: [
    CatalogController,
    CategoriesController,
    StoresController,
    SellerCatalogController,
  ],
  providers: [
    CatalogService,
    CatalogRepository,
    SellerService,
    SellerRepository,
  ],
  exports: [CatalogRepository],
})
export class CatalogModule {}
