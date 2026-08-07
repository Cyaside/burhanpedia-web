import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import {
  AdjustInventoryDto,
  CreateProductDto,
  CreateStoreDto,
  UpdateProductDto,
} from '../application/seller.dto';

export interface StoreRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  logoAltText: string | null;
  status: string;
  ratingAverage?: string;
  ratingCount?: number;
}

export interface SellerProductRow {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  version: number;
  min_price_amount: string | null;
  created_at: Date;
}

@Injectable()
export class SellerRepository {
  constructor(private readonly database: DatabaseService) {}

  async storeForUser(
    userId: string,
    client?: PoolClient,
  ): Promise<StoreRow | null> {
    const sql = `SELECT s.id, s.slug, s.name, s.description,
                        s.logo_url AS "logoUrl",
                        s.logo_alt_text AS "logoAltText", s.status
                 FROM stores s
                 JOIN seller_profiles sp ON sp.id = s.seller_profile_id
                 WHERE sp.user_id = $1`;
    const result = client
      ? await client.query<StoreRow>(sql, [userId])
      : await this.database.query<StoreRow>(sql, [userId]);
    return result.rows[0] ?? null;
  }

  async storeBySlug(slug: string): Promise<StoreRow | null> {
    const result = await this.database.query<StoreRow>(
      `SELECT id, slug, name, description,
              logo_url AS "logoUrl", logo_alt_text AS "logoAltText", status,
              CASE WHEN coalesce(rating.rating_count, 0) = 0 THEN 0
                   ELSE round(rating.rating_sum::numeric / rating.rating_count, 2)
              END AS "ratingAverage",
              coalesce(rating.rating_count, 0)::integer AS "ratingCount"
       FROM stores s
       LEFT JOIN LATERAL (
         SELECT coalesce(sum(p.rating_sum), 0)::bigint AS rating_sum,
                coalesce(sum(p.rating_count), 0)::integer AS rating_count
         FROM products p WHERE p.store_id = s.id AND p.status = 'ACTIVE'
       ) rating ON true
       WHERE s.slug = $1 AND s.status = 'ACTIVE'`,
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async createStore(
    userId: string,
    dto: CreateStoreDto,
  ): Promise<StoreRow | null> {
    const result = await this.database.query<StoreRow>(
      `INSERT INTO stores (seller_profile_id, slug, name, description, status)
       SELECT sp.id, $2, $3, $4, 'ACTIVE'
       FROM seller_profiles sp WHERE sp.user_id = $1
       RETURNING id, slug, name, description,
                 logo_url AS "logoUrl", logo_alt_text AS "logoAltText", status`,
      [userId, dto.slug, dto.name, dto.description ?? null],
    );
    return result.rows[0] ?? null;
  }

  async createProduct(
    userId: string,
    dto: CreateProductDto,
  ): Promise<SellerProductRow | null> {
    return this.database.withTransaction(async (client) => {
      const store = await this.storeForUser(userId, client);
      if (!store) return null;
      const created = await client.query<SellerProductRow>(
        `INSERT INTO products (store_id, category_id, slug, name, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, store_id, slug, name, description, status, version,
                   min_price_amount, created_at`,
        [
          store.id,
          dto.categoryId ?? null,
          dto.slug,
          dto.name,
          dto.description ?? null,
        ],
      );
      for (const variant of dto.variants) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO product_variants
           (product_id, sku, name, attributes, price_amount)
           VALUES ($1, $2, $3, $4::jsonb, $5::bigint) RETURNING id`,
          [
            created.rows[0].id,
            variant.sku,
            variant.name,
            JSON.stringify(variant.attributes),
            variant.priceAmount,
          ],
        );
        await client.query(
          'INSERT INTO inventories (variant_id, on_hand) VALUES ($1, $2)',
          [inserted.rows[0].id, variant.onHand],
        );
        if (variant.onHand > 0) {
          await client.query(
            `INSERT INTO inventory_adjustments
             (variant_id, quantity_delta, reason, actor_user_id)
             VALUES ($1, $2, 'Initial stock', $3)`,
            [inserted.rows[0].id, variant.onHand, userId],
          );
        }
      }
      const result = await client.query<SellerProductRow>(
        `SELECT id, store_id, slug, name, description, status, version,
                min_price_amount, created_at
         FROM products WHERE id = $1`,
        [created.rows[0].id],
      );
      return result.rows[0];
    });
  }

  async sellerProducts(
    userId: string,
    limit: number,
    cursor?: { createdAt: string; id: string },
  ): Promise<SellerProductRow[]> {
    const result = await this.database.query<SellerProductRow>(
      `SELECT p.id, p.store_id, p.slug, p.name, p.description,
              p.status, p.version, p.min_price_amount, p.created_at
       FROM products p
       JOIN stores s ON s.id = p.store_id
       JOIN seller_profiles sp ON sp.id = s.seller_profile_id
       WHERE sp.user_id = $1
         AND ($3::timestamptz IS NULL OR (p.created_at, p.id) < ($3, $4::uuid))
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $2`,
      [userId, limit, cursor?.createdAt ?? null, cursor?.id ?? null],
    );
    return result.rows;
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<SellerProductRow | null> {
    const result = await this.database.query<SellerProductRow>(
      `UPDATE products p SET
         name = coalesce($3, p.name),
         description = coalesce($4, p.description),
         category_id = coalesce($5, p.category_id),
         status = coalesce($6, p.status)
       FROM stores s, seller_profiles sp
       WHERE p.id = $2 AND p.store_id = s.id
         AND s.seller_profile_id = sp.id AND sp.user_id = $1
         AND p.version = $7
         AND (coalesce($6::product_status, p.status) <> 'ACTIVE'
              OR p.min_price_amount IS NOT NULL)
       RETURNING p.id, p.store_id, p.slug, p.name, p.description,
                 p.status, p.version, p.min_price_amount, p.created_at`,
      [
        userId,
        productId,
        dto.name ?? null,
        dto.description ?? null,
        dto.categoryId ?? null,
        dto.status ?? null,
        dto.version,
      ],
    );
    return result.rows[0] ?? null;
  }

  async addVariant(
    userId: string,
    productId: string,
    input: CreateProductDto['variants'][number],
  ): Promise<{ id: string; priceAmount: string; onHand: number } | null> {
    return this.database.withTransaction(async (client) => {
      const result = await client.query<{ id: string; price_amount: string }>(
        `INSERT INTO product_variants
         (product_id, sku, name, attributes, price_amount)
         SELECT p.id, $3, $4, $5::jsonb, $6::bigint
         FROM products p
         JOIN stores s ON s.id = p.store_id
         JOIN seller_profiles sp ON sp.id = s.seller_profile_id
         WHERE p.id = $2 AND sp.user_id = $1 AND p.status <> 'ARCHIVED'
         RETURNING id, price_amount`,
        [
          userId,
          productId,
          input.sku,
          input.name,
          JSON.stringify(input.attributes),
          input.priceAmount,
        ],
      );
      if (!result.rows[0]) return null;
      await client.query(
        'INSERT INTO inventories (variant_id, on_hand) VALUES ($1, $2)',
        [result.rows[0].id, input.onHand],
      );
      if (input.onHand > 0) {
        await client.query(
          `INSERT INTO inventory_adjustments
           (variant_id, quantity_delta, reason, actor_user_id)
           VALUES ($1, $2, 'Initial stock', $3)`,
          [result.rows[0].id, input.onHand, userId],
        );
      }
      return {
        id: result.rows[0].id,
        priceAmount: result.rows[0].price_amount,
        onHand: input.onHand,
      };
    });
  }

  async adjustInventory(
    userId: string,
    variantId: string,
    dto: AdjustInventoryDto,
  ): Promise<{ onHand: number; reserved: number; version: number } | null> {
    return this.database.withTransaction(async (client) => {
      const result = await client.query<{
        on_hand: number;
        reserved: number;
        version: number;
      }>(
        `UPDATE inventories i SET
           on_hand = i.on_hand + $3,
           version = i.version + 1
         FROM product_variants v, products p, stores s, seller_profiles sp
         WHERE i.variant_id = $2 AND i.variant_id = v.id
           AND v.product_id = p.id AND p.store_id = s.id
           AND s.seller_profile_id = sp.id AND sp.user_id = $1
           AND i.on_hand + $3 >= i.reserved
           AND i.on_hand + $3 >= 0
         RETURNING i.on_hand, i.reserved, i.version`,
        [userId, variantId, dto.quantityDelta],
      );
      if (!result.rows[0]) return null;
      await client.query(
        `INSERT INTO inventory_adjustments
         (variant_id, quantity_delta, reason, actor_user_id)
         VALUES ($1, $2, $3, $4)`,
        [variantId, dto.quantityDelta, dto.reason, userId],
      );
      return {
        onHand: result.rows[0].on_hand,
        reserved: result.rows[0].reserved,
        version: result.rows[0].version,
      };
    });
  }

  async ownsProduct(userId: string, productId: string): Promise<boolean> {
    const result = await this.database.query(
      `SELECT 1 FROM products p
       JOIN stores s ON s.id = p.store_id
       JOIN seller_profiles sp ON sp.id = s.seller_profile_id
       WHERE p.id = $2 AND sp.user_id = $1`,
      [userId, productId],
    );
    return result.rowCount === 1;
  }

  async ownsVariant(userId: string, variantId: string): Promise<boolean> {
    const result = await this.database.query(
      `SELECT 1 FROM product_variants v
       JOIN products p ON p.id = v.product_id
       JOIN stores s ON s.id = p.store_id
       JOIN seller_profiles sp ON sp.id = s.seller_profile_id
       WHERE v.id = $2 AND sp.user_id = $1`,
      [userId, variantId],
    );
    return result.rowCount === 1;
  }
}
