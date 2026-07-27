import { Module } from '@nestjs/common';
import { CatalogService } from './application/catalog.service';
import { CatalogRepository } from './infrastructure/catalog.repository';
import {
  CatalogController,
  CategoriesController,
} from './presentation/catalog.controller';

@Module({
  controllers: [CatalogController, CategoriesController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogRepository],
})
export class CatalogModule {}
