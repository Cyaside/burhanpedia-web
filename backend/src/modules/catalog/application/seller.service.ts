import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  SellerRepository,
  SellerProductRow,
} from '../infrastructure/seller.repository';
import {
  AdjustInventoryDto,
  CreateProductDto,
  CreateStoreDto,
  CreateVariantDto,
  UpdateProductDto,
} from './seller.dto';

@Injectable()
export class SellerService {
  constructor(private readonly sellers: SellerRepository) {}

  async createStore(userId: string, dto: CreateStoreDto) {
    try {
      const store = await this.sellers.createStore(userId, dto);
      if (!store) throw this.sellerNotFound();
      return store;
    } catch (error) {
      this.mapUniqueConflict(error, 'STORE_ALREADY_EXISTS');
      throw error;
    }
  }

  async publicStore(slug: string) {
    const store = await this.sellers.storeBySlug(slug);
    if (!store) throw this.storeNotFound();
    return store;
  }

  async myStore(userId: string) {
    const store = await this.sellers.storeForUser(userId);
    if (!store) throw this.storeNotFound();
    return store;
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const skus = dto.variants.map((variant) => variant.sku);
    if (new Set(skus).size !== skus.length) {
      throw new ConflictException({
        code: 'DUPLICATE_VARIANT_SKU',
        detail: 'Variant SKUs must be unique.',
      });
    }
    try {
      const product = await this.sellers.createProduct(userId, dto);
      if (!product) throw this.storeNotFound();
      return this.present(product);
    } catch (error) {
      this.mapUniqueConflict(error, 'PRODUCT_ALREADY_EXISTS');
      throw error;
    }
  }

  async myProducts(userId: string) {
    const rows = await this.sellers.sellerProducts(userId);
    return { items: rows.map((row) => this.present(row)) };
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.sellers.updateProduct(userId, productId, dto);
    if (product) return this.present(product);
    if (!(await this.sellers.ownsProduct(userId, productId))) {
      throw this.productNotFound();
    }
    throw new ConflictException({
      code: 'PRODUCT_VERSION_CONFLICT',
      detail: 'The product has changed. Reload it before saving.',
    });
  }

  async addVariant(userId: string, productId: string, dto: CreateVariantDto) {
    try {
      const variant = await this.sellers.addVariant(userId, productId, dto);
      if (!variant) throw this.productNotFound();
      return variant;
    } catch (error) {
      this.mapUniqueConflict(error, 'VARIANT_SKU_ALREADY_EXISTS');
      throw error;
    }
  }

  async adjustInventory(
    userId: string,
    variantId: string,
    dto: AdjustInventoryDto,
  ) {
    const inventory = await this.sellers.adjustInventory(
      userId,
      variantId,
      dto,
    );
    if (inventory) return inventory;
    if (!(await this.sellers.ownsVariant(userId, variantId))) {
      throw this.variantNotFound();
    }
    throw new UnprocessableEntityException({
      code: 'INSUFFICIENT_STOCK',
      detail: 'The adjustment would make stock negative or below reservations.',
    });
  }

  private present(row: SellerProductRow) {
    return {
      id: row.id,
      storeId: row.store_id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status,
      version: row.version,
      minPriceAmount: row.min_price_amount,
      createdAt: row.created_at.toISOString(),
    };
  }

  private mapUniqueConflict(error: unknown, code: string): void {
    if (error instanceof DatabaseError && error.code === '23505') {
      throw new ConflictException({
        code,
        detail: 'A resource with this slug or SKU already exists.',
      });
    }
  }

  private sellerNotFound() {
    return new NotFoundException({
      code: 'SELLER_PROFILE_NOT_FOUND',
      detail: 'The seller profile does not exist.',
    });
  }

  private storeNotFound() {
    return new NotFoundException({
      code: 'STORE_NOT_FOUND',
      detail: 'The store does not exist.',
    });
  }

  private productNotFound() {
    return new NotFoundException({
      code: 'PRODUCT_NOT_FOUND',
      detail: 'The product does not exist.',
    });
  }

  private variantNotFound() {
    return new NotFoundException({
      code: 'VARIANT_NOT_FOUND',
      detail: 'The variant does not exist.',
    });
  }
}
