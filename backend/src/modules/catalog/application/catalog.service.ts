import { BadRequestException, Injectable } from '@nestjs/common';
import { CatalogQueryDto, CatalogSort } from './catalog.dto';
import {
  CatalogRepository,
  CatalogRow,
} from '../infrastructure/catalog.repository';

interface Cursor {
  sort: CatalogSort;
  value: string;
  id: string;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CatalogService {
  constructor(private readonly catalog: CatalogRepository) {}

  async list(query: CatalogQueryDto) {
    const sort = query.sort ?? 'newest';
    const limit = query.limit ?? 24;
    const cursor = this.decodeCursor(query.cursor, sort);
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      BigInt(query.minPrice) > BigInt(query.maxPrice)
    ) {
      throw new BadRequestException({
        code: 'INVALID_PRICE_RANGE',
        detail: 'Minimum price cannot exceed maximum price.',
      });
    }
    const rows = await this.catalog.list({
      ...query,
      sort,
      limit: limit + 1,
      cursor,
    });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((row) => this.present(row));
    const last = hasMore ? rows[limit - 1] : null;
    return {
      items,
      nextCursor: last ? this.encodeCursor(last, sort) : null,
    };
  }

  async product(id: string) {
    const product = await this.catalog.product(id);
    return product ? this.present(product) : null;
  }

  categories() {
    return this.catalog.categories();
  }

  private present(row: CatalogRow) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      store: {
        id: row.store_id,
        slug: row.store_slug,
        name: row.store_name,
      },
      category: row.category_id
        ? { id: row.category_id, name: row.category_name }
        : null,
      minPriceAmount: row.min_price_amount,
      ratingAverage: Number(row.rating_average),
      ratingCount: row.rating_count,
      soldCount: Number(row.sold_count ?? 0),
      availableQuantity: Number(row.available_quantity),
      images: row.images,
      variants: row.variants ?? [],
      createdAt: row.created_at.toISOString(),
    };
  }

  private encodeCursor(row: CatalogRow, sort: CatalogSort): string {
    const value =
      sort === 'newest'
        ? row.created_at.toISOString()
        : sort === 'name_asc'
          ? row.name.toLowerCase()
          : row.min_price_amount;
    return Buffer.from(JSON.stringify({ sort, value, id: row.id })).toString(
      'base64url',
    );
  }

  private decodeCursor(
    encoded: string | undefined,
    sort: CatalogSort,
  ): Cursor | null {
    if (!encoded) return null;
    try {
      const value: unknown = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      );
      if (
        typeof value !== 'object' ||
        value === null ||
        !('sort' in value) ||
        !('value' in value) ||
        !('id' in value) ||
        value.sort !== sort ||
        typeof value.value !== 'string' ||
        typeof value.id !== 'string' ||
        !UUID.test(value.id)
      ) {
        throw new Error('Malformed cursor');
      }
      if (sort === 'newest' && Number.isNaN(Date.parse(value.value))) {
        throw new Error('Invalid cursor date');
      }
      if (
        (sort === 'price_asc' || sort === 'price_desc') &&
        !/^[0-9]{1,15}$/.test(value.value)
      ) {
        throw new Error('Invalid cursor price');
      }
      return value as Cursor;
    } catch {
      throw new BadRequestException({
        code: 'INVALID_CURSOR',
        detail: 'The catalog cursor is invalid for this sort order.',
      });
    }
  }
}
