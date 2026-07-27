import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/security/public.decorator';
import { CatalogQueryDto } from '../application/catalog.dto';
import { CatalogService } from '../application/catalog.service';

@Public()
@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  @Get()
  list(@Query() query: CatalogQueryDto) {
    return this.catalog.list(query);
  }

  @Get(':id')
  async product(@Param('id') id: string) {
    const product = await this.catalog.product(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        detail: 'The requested product does not exist.',
      });
    }
    return product;
  }
}

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list() {
    return this.catalog.categories();
  }
}
