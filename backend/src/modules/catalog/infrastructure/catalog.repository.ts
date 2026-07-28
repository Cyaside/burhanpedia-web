import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CatalogSort } from '../application/catalog.dto';

export interface CatalogRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  store_id: string;
  store_slug: string;
  store_name: string;
  category_id: string | null;
  category_name: string | null;
  min_price_amount: string | null;
  rating_average: string;
  rating_count: number;
  available_quantity: string;
  images: Array<{ url: string; alt: string }>;
  variants?: Array<{
    id: string;
    name: string;
    attributes: Record<string, unknown>;
    priceAmount: string;
    availableQuantity: number;
  }>;
  created_at: Date;
}

interface ListInput {
  q?: string;
  categoryId?: string;
  storeId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort: CatalogSort;
  limit: number;
  cursor: { value: string; id: string } | null;
}

const SORT_SQL: Record<CatalogSort, { expression: string; direction: string }> =
  {
    newest: { expression: 'p.created_at', direction: 'DESC' },
    price_asc: { expression: 'p.min_price_amount', direction: 'ASC' },
    price_desc: { expression: 'p.min_price_amount', direction: 'DESC' },
    name_asc: { expression: 'lower(p.name)', direction: 'ASC' },
  };

@Injectable()
export class CatalogRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(input: ListInput): Promise<CatalogRow[]> {
    const conditions = [
      "p.status = 'ACTIVE'",
      "(SELECT s.status FROM stores s WHERE s.id = p.store_id) = 'ACTIVE'",
      'p.min_price_amount IS NOT NULL',
    ];
    const values: unknown[] = [];
    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (input.categoryId)
      conditions.push(`p.category_id = ${add(input.categoryId)}`);
    if (input.storeId) conditions.push(`p.store_id = ${add(input.storeId)}`);
    if (input.minPrice)
      conditions.push(`p.min_price_amount >= ${add(input.minPrice)}::bigint`);
    if (input.maxPrice)
      conditions.push(`p.min_price_amount <= ${add(input.maxPrice)}::bigint`);
    if (input.q) {
      const escaped = input.q.trim().replace(/[\\%_]/g, '\\$&');
      conditions.push(
        `(p.name || ' ' || coalesce(p.description, '')) ILIKE ${add(`%${escaped}%`)} ESCAPE '\\'`,
      );
    }
    const { expression, direction } = SORT_SQL[input.sort];
    if (input.cursor) {
      const value = add(input.cursor.value);
      const id = add(input.cursor.id);
      const operator = direction === 'DESC' ? '<' : '>';
      const cast =
        input.sort === 'newest'
          ? '::timestamptz'
          : input.sort.startsWith('price_')
            ? '::bigint'
            : '::text';
      conditions.push(
        `(${expression}, p.id) ${operator} (${value}${cast}, ${id}::uuid)`,
      );
    }
    const limit = add(input.limit);

    const result = await this.database.query<CatalogRow>(
      `WITH page AS MATERIALIZED (
         SELECT p.id, p.slug, p.name, p.description, p.store_id,
                p.category_id, p.min_price_amount, p.rating_average,
                p.rating_count, p.created_at
         FROM products p
         WHERE ${conditions.join(' AND ')}
         ORDER BY ${expression} ${direction}, p.id ${direction}
         LIMIT ${limit}
       )
       SELECT page.*, s.slug AS store_slug, s.name AS store_name,
              c.name AS category_name,
              coalesce(stock.available_quantity, 0)::text AS available_quantity,
              coalesce(pictures.images, '[]'::jsonb) AS images
       FROM page
       JOIN stores s ON s.id = page.store_id
       LEFT JOIN categories c ON c.id = page.category_id
       LEFT JOIN LATERAL (
         SELECT sum(greatest(i.on_hand - i.reserved, 0)) AS available_quantity
         FROM product_variants v
         JOIN inventories i ON i.variant_id = v.id
         WHERE v.product_id = page.id AND v.status = 'ACTIVE'
       ) stock ON true
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object('url', img.public_url,
                                            'alt', img.alt_text)
                          ORDER BY img.position) AS images
         FROM product_images img WHERE img.product_id = page.id
       ) pictures ON true
       ORDER BY ${input.sort === 'name_asc' ? 'lower(page.name)' : input.sort === 'newest' ? 'page.created_at' : 'page.min_price_amount'} ${direction}, page.id ${direction}`,
      values,
    );
    return result.rows;
  }

  async product(id: string): Promise<CatalogRow | null> {
    const result = await this.database.query<CatalogRow>(
      `SELECT p.id, p.slug, p.name, p.description, p.store_id,
              p.category_id, p.min_price_amount, p.rating_average,
              p.rating_count, p.created_at,
              s.slug AS store_slug, s.name AS store_name,
              c.name AS category_name,
              coalesce(variants.variants, '[]'::jsonb) AS variants,
              coalesce(variants.available_quantity, 0)::text AS available_quantity,
              coalesce(pictures.images, '[]'::jsonb) AS images
       FROM products p
       JOIN stores s ON s.id = p.store_id AND s.status = 'ACTIVE'
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
                  'id', v.id, 'name', v.name, 'attributes', v.attributes,
                  'priceAmount', v.price_amount::text,
                  'availableQuantity', greatest(coalesce(i.on_hand, 0) - coalesce(i.reserved, 0), 0)
                ) ORDER BY v.created_at, v.id) AS variants,
                sum(greatest(coalesce(i.on_hand, 0) - coalesce(i.reserved, 0), 0)) AS available_quantity
         FROM product_variants v
         LEFT JOIN inventories i ON i.variant_id = v.id
         WHERE v.product_id = p.id AND v.status = 'ACTIVE'
       ) variants ON true
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object('url', img.public_url,
                                            'alt', img.alt_text)
                          ORDER BY img.position) AS images
         FROM product_images img WHERE img.product_id = p.id
       ) pictures ON true
       WHERE p.id = $1 AND p.status = 'ACTIVE'`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async categories() {
    const result = await this.database.query<{
      id: string;
      slug: string;
      name: string;
      parent_id: string | null;
    }>(
      `SELECT id, slug, name, parent_id FROM categories
       WHERE is_active ORDER BY sort_order, name, id`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      parentId: row.parent_id,
    }));
  }
}
