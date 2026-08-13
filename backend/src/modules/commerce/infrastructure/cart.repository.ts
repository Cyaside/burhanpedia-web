import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreateAddressDto } from '../application/cart.dto';

export interface CartRow {
  cart_id: string;
  cart_version: number;
  item_id: string;
  variant_id: string;
  quantity: number;
  unit_price_amount: string;
  variant_name: string;
  available_quantity: number;
  product_id: string;
  product_name: string;
  store_id: string;
  store_name: string;
  image_url: string | null;
}

interface AddressRow {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

@Injectable()
export class CartRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string): Promise<CartRow[]> {
    const result = await this.database.query<CartRow>(
      `SELECT c.id AS cart_id, c.version AS cart_version,
              ci.id AS item_id, ci.variant_id, ci.quantity,
              v.price_amount AS unit_price_amount, v.name AS variant_name,
              greatest(i.on_hand - i.reserved, 0) AS available_quantity,
              p.id AS product_id, p.name AS product_name,
              s.id AS store_id, s.name AS store_name,
              image.public_url AS image_url
       FROM buyer_profiles bp
       JOIN carts c ON c.buyer_profile_id = bp.id AND c.status = 'ACTIVE'
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN product_variants v ON v.id = ci.variant_id
       JOIN inventories i ON i.variant_id = v.id
       JOIN products p ON p.id = v.product_id
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN LATERAL (
         SELECT public_url FROM product_images
         WHERE product_id = p.id ORDER BY position LIMIT 1
       ) image ON true
       WHERE bp.user_id = $1
       ORDER BY s.name, s.id, ci.created_at, ci.id`,
      [userId],
    );
    return result.rows;
  }

  async add(userId: string, variantId: string, quantity: number) {
    return this.database.withTransaction(async (client) => {
      const cart = await client.query<{ id: string }>(
        `INSERT INTO carts (buyer_profile_id)
         SELECT id FROM buyer_profiles WHERE user_id = $1
         ON CONFLICT (buyer_profile_id) WHERE status = 'ACTIVE'
         DO UPDATE SET updated_at = carts.updated_at
         RETURNING id`,
        [userId],
      );
      if (!cart.rows[0]) return 'BUYER_NOT_FOUND' as const;
      const stock = await client.query<{ available: number }>(
        `SELECT (i.on_hand - i.reserved)::integer AS available
         FROM product_variants v
         JOIN inventories i ON i.variant_id = v.id
         JOIN products p ON p.id = v.product_id
         JOIN stores s ON s.id = p.store_id
         WHERE v.id = $1 AND v.status = 'ACTIVE'
           AND p.status = 'ACTIVE' AND s.status = 'ACTIVE'
         FOR UPDATE OF i`,
        [variantId],
      );
      if (!stock.rows[0]) return 'VARIANT_NOT_FOUND' as const;
      const item = await client.query<{ id: string }>(
        `INSERT INTO cart_items (cart_id, variant_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, variant_id) DO UPDATE
         SET quantity = cart_items.quantity + EXCLUDED.quantity
         WHERE cart_items.quantity + EXCLUDED.quantity <= $4
         RETURNING id`,
        [cart.rows[0].id, variantId, quantity, stock.rows[0].available],
      );
      if (!item.rows[0]) return 'INSUFFICIENT_STOCK' as const;
      await client.query(
        'UPDATE carts SET version = version + 1 WHERE id = $1',
        [cart.rows[0].id],
      );
      return 'OK' as const;
    });
  }

  async update(userId: string, itemId: string, quantity: number) {
    const result = await this.database.query<{ id: string }>(
      `UPDATE cart_items ci SET quantity = $3
       FROM carts c, buyer_profiles bp, product_variants v, inventories i
       WHERE ci.id = $2 AND ci.cart_id = c.id
         AND c.buyer_profile_id = bp.id AND bp.user_id = $1
         AND c.status = 'ACTIVE' AND ci.variant_id = v.id
         AND i.variant_id = v.id AND $3 <= i.on_hand - i.reserved
       RETURNING ci.id`,
      [userId, itemId, quantity],
    );
    return Boolean(result.rows[0]);
  }

  async remove(userId: string, itemId: string): Promise<boolean> {
    const result = await this.database.query(
      `DELETE FROM cart_items ci USING carts c, buyer_profiles bp
       WHERE ci.id = $2 AND ci.cart_id = c.id
         AND c.buyer_profile_id = bp.id AND bp.user_id = $1
         AND c.status = 'ACTIVE'`,
      [userId, itemId],
    );
    return result.rowCount === 1;
  }

  async addresses(userId: string): Promise<AddressRow[]> {
    const result = await this.database.query<AddressRow>(
      `SELECT a.id, a.label, a.recipient_name AS "recipientName", a.phone,
              a.line1, a.line2, a.city, a.province,
              a.postal_code AS "postalCode", a.is_default AS "isDefault"
       FROM addresses a JOIN buyer_profiles bp ON bp.id = a.buyer_profile_id
       WHERE bp.user_id = $1 ORDER BY a.is_default DESC, a.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressRow | null> {
    return this.database.withTransaction(async (client) => {
      const buyer = await client.query<{ id: string }>(
        'SELECT id FROM buyer_profiles WHERE user_id = $1',
        [userId],
      );
      if (!buyer.rows[0]) return null;
      if (dto.isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE buyer_profile_id = $1',
          [buyer.rows[0].id],
        );
      }
      const result = await client.query<AddressRow>(
        `INSERT INTO addresses
         (buyer_profile_id, label, recipient_name, phone, line1, line2,
          city, province, postal_code, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, label, recipient_name AS "recipientName", phone,
                   line1, line2, city, province, postal_code AS "postalCode",
                   is_default AS "isDefault"`,
        [
          buyer.rows[0].id,
          dto.label,
          dto.recipientName,
          dto.phone,
          dto.line1,
          dto.line2 ?? null,
          dto.city,
          dto.province,
          dto.postalCode,
          dto.isDefault ?? false,
        ],
      );
      return result.rows[0];
    });
  }
}
