import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import {
  DeliveryMethod,
  PriceResult,
  PricingEngine,
  PromotionRule,
} from '../domain/pricing.engine';

export interface CheckoutLineRow {
  buyer_profile_id: string;
  cart_id: string;
  item_id: string;
  variant_id: string;
  quantity: number;
  price_amount: string;
  variant_name: string;
  sku: string;
  attributes: Record<string, unknown>;
  product_name: string;
  product_status: string;
  variant_status: string;
  store_id: string;
  store_status: string;
  inventory_id: string;
  available_quantity: number;
}

export interface AddressRow {
  id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
}

export interface VoucherRow {
  id: string;
  promotion_id: string;
  store_id: string | null;
  kind: PromotionRule['kind'];
  value_amount: string | null;
  value_basis_points: number | null;
  maximum_discount_amount: string | null;
  minimum_subtotal_amount: string;
}

export interface CheckoutData {
  lines: CheckoutLineRow[];
  address: AddressRow | null;
  voucher: VoucherRow | null;
}

export interface CheckoutInput {
  userId: string;
  addressId: string;
  voucherCode?: string;
  deliveries: Map<string, DeliveryMethod>;
  idempotencyKey: string;
  fingerprint: string;
}

class CheckoutAbort extends Error {
  constructor(readonly status: 'INSUFFICIENT_STOCK') {
    super(status);
  }
}

@Injectable()
export class CheckoutRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly pricing: PricingEngine,
  ) {}

  async quote(userId: string, addressId: string, voucherCode?: string) {
    const client = await this.databaseClient();
    try {
      return await this.load(client, userId, addressId, voucherCode, false);
    } finally {
      client.release();
    }
  }

  async checkout(input: CheckoutInput) {
    try {
      return await this.database.withTransaction(
        async (client) => {
          const existing = await this.existing(
            client,
            input.userId,
            input.idempotencyKey,
          );
          if (existing) {
            return existing.request_fingerprint === input.fingerprint
              ? { status: 'OK' as const, checkoutId: existing.id }
              : { status: 'IDEMPOTENCY_CONFLICT' as const };
          }

          const data = await this.load(
            client,
            input.userId,
            input.addressId,
            input.voucherCode,
            true,
          );
          if (!data.address) return { status: 'ADDRESS_NOT_FOUND' as const };
          if (!data.lines.length) return { status: 'EMPTY_CART' as const };
          if (input.voucherCode && !data.voucher)
            return { status: 'VOUCHER_INVALID' as const };
          if (
            data.lines.some((line) => line.available_quantity < line.quantity)
          ) {
            return { status: 'INSUFFICIENT_STOCK' as const };
          }

          const storeIds = [
            ...new Set(data.lines.map((line) => line.store_id)),
          ].sort();
          if (
            input.deliveries.size !== storeIds.length ||
            storeIds.some((storeId) => !input.deliveries.has(storeId))
          ) {
            return { status: 'DELIVERY_SELECTION_INVALID' as const };
          }
          if (
            data.lines.some(
              (line) =>
                line.product_status !== 'ACTIVE' ||
                line.variant_status !== 'ACTIVE' ||
                line.store_status !== 'ACTIVE',
            )
          ) {
            return { status: 'PRODUCT_UNAVAILABLE' as const };
          }
          const totals = this.calculate(data, input.deliveries);
          const wallet = await client.query<{
            id: string;
            balance_amount: string;
          }>(
            `SELECT w.id, w.balance_amount FROM wallet_accounts w
           JOIN buyer_profiles bp ON bp.id = w.buyer_profile_id
           WHERE bp.user_id = $1 FOR UPDATE OF w`,
            [input.userId],
          );
          if (
            !wallet.rows[0] ||
            BigInt(wallet.rows[0].balance_amount) < totals.total
          ) {
            return { status: 'INSUFFICIENT_BALANCE' as const };
          }

          const group = await client.query<{ id: string }>(
            `INSERT INTO checkout_groups
           (buyer_profile_id, cart_id, idempotency_key, subtotal_amount,
            discount_amount, shipping_amount, total_amount, request_fingerprint, voucher_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [
              data.lines[0].buyer_profile_id,
              data.lines[0].cart_id,
              input.idempotencyKey,
              totals.subtotal.toString(),
              totals.discount.toString(),
              totals.shipping.toString(),
              totals.total.toString(),
              input.fingerprint,
              data.voucher?.id ?? null,
            ],
          );
          const checkoutId = group.rows[0].id;

          for (const storeTotal of totals.stores) {
            const order = await this.createOrder(
              client,
              checkoutId,
              data,
              storeTotal,
              input.deliveries.get(storeTotal.storeId)!,
              input.userId,
            );
            const storeLines = data.lines.filter(
              (line) => line.store_id === storeTotal.storeId,
            );
            for (const line of storeLines) {
              const stock = await client.query(
                `UPDATE inventories SET on_hand = on_hand - $2, version = version + 1
               WHERE variant_id = $1 AND on_hand - reserved >= $2`,
                [line.inventory_id, line.quantity],
              );
              if (stock.rowCount !== 1)
                throw new CheckoutAbort('INSUFFICIENT_STOCK');
              const item = await client.query<{ id: string }>(
                `INSERT INTO order_items
               (order_id, variant_id, product_name, variant_name, sku, attributes,
                unit_price_amount, quantity, line_total_amount)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
                [
                  order.id,
                  line.variant_id,
                  line.product_name,
                  line.variant_name,
                  line.sku,
                  JSON.stringify(line.attributes),
                  line.price_amount,
                  line.quantity,
                  (
                    BigInt(line.price_amount) * BigInt(line.quantity)
                  ).toString(),
                ],
              );
              await client.query(
                `INSERT INTO inventory_reservations
               (order_item_id, variant_id, quantity, status, expires_at)
               VALUES ($1,$2,$3,'CONSUMED',application_now() + interval '7 days')`,
                [item.rows[0].id, line.variant_id, line.quantity],
              );
            }
          }

          const balanceAfter =
            BigInt(wallet.rows[0].balance_amount) - totals.total;
          await client.query(
            `UPDATE wallet_accounts SET balance_amount = $2, version = version + 1 WHERE id = $1`,
            [wallet.rows[0].id, balanceAfter.toString()],
          );
          await client.query(
            `INSERT INTO wallet_ledger_entries
           (wallet_account_id, entry_type, amount_delta, balance_after,
            reference_type, reference_id, idempotency_key, description)
           VALUES ($1,'PAYMENT',$2,$3,'CHECKOUT',$4,$5,'Checkout payment')`,
            [
              wallet.rows[0].id,
              (-totals.total).toString(),
              balanceAfter.toString(),
              checkoutId,
              `checkout:${input.idempotencyKey}`,
            ],
          );
          await client.query(
            `INSERT INTO payments
           (checkout_group_id, wallet_account_id, status, amount, idempotency_key, paid_at)
           VALUES ($1,$2,'SUCCEEDED',$3,$4,application_now())`,
            [
              checkoutId,
              wallet.rows[0].id,
              totals.total.toString(),
              `payment:${input.idempotencyKey}`,
            ],
          );
          if (data.voucher) {
            await client.query(
              `UPDATE vouchers SET redemption_count = redemption_count + 1
             WHERE id = $1 AND (quota IS NULL OR redemption_count < quota)`,
              [data.voucher.id],
            );
            await client.query(
              `INSERT INTO voucher_redemptions
             (voucher_id, buyer_profile_id, checkout_group_id, discount_amount)
             VALUES ($1,$2,$3,$4)`,
              [
                data.voucher.id,
                data.lines[0].buyer_profile_id,
                checkoutId,
                totals.discount.toString(),
              ],
            );
          }
          await client.query(
            "UPDATE carts SET status = 'CHECKED_OUT', version = version + 1 WHERE id = $1",
            [data.lines[0].cart_id],
          );
          await client.query(
            `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
           VALUES ('CHECKOUT',$1,'CHECKOUT_COMPLETED',$2::jsonb)`,
            [checkoutId, JSON.stringify({ checkoutId })],
          );
          return { status: 'OK' as const, checkoutId };
        },
        { isolationLevel: 'SERIALIZABLE', maxRetries: 3 },
      );
    } catch (error) {
      if (error instanceof CheckoutAbort) return { status: error.status };
      throw error;
    }
  }

  async checkoutView(userId: string, checkoutId: string) {
    const result = await this.database.query(
      `SELECT cg.id, cg.subtotal_amount AS "subtotalAmount",
              cg.discount_amount AS "discountAmount", cg.shipping_amount AS "shippingAmount",
              cg.total_amount AS "totalAmount", cg.created_at AS "createdAt",
              coalesce(jsonb_agg(jsonb_build_object(
                'id', o.id, 'number', o.order_number, 'status', o.status,
                'storeId', o.store_id, 'totalAmount', o.total_amount::text
              ) ORDER BY o.order_number), '[]'::jsonb) AS orders
       FROM checkout_groups cg
       JOIN buyer_profiles bp ON bp.id = cg.buyer_profile_id
       JOIN orders o ON o.checkout_group_id = cg.id
       WHERE cg.id = $2 AND bp.user_id = $1
       GROUP BY cg.id`,
      [userId, checkoutId],
    );
    return result.rows[0] ?? null;
  }

  private async load(
    client: PoolClient,
    userId: string,
    addressId: string,
    voucherCode: string | undefined,
    lock: boolean,
  ): Promise<CheckoutData> {
    const lines = await client.query<CheckoutLineRow>(
      `SELECT bp.id AS buyer_profile_id, c.id AS cart_id, ci.id AS item_id,
              v.id AS variant_id, ci.quantity, v.price_amount, v.name AS variant_name,
              v.sku, v.attributes, v.status AS variant_status,
              p.name AS product_name, p.status AS product_status,
              s.id AS store_id, s.status AS store_status,
              i.variant_id AS inventory_id,
              (i.on_hand - i.reserved)::integer AS available_quantity
       FROM buyer_profiles bp
       JOIN carts c ON c.buyer_profile_id = bp.id AND c.status = 'ACTIVE'
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN product_variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN stores s ON s.id = p.store_id
       JOIN inventories i ON i.variant_id = v.id
       WHERE bp.user_id = $1
       ORDER BY s.id, ci.id
       ${lock ? 'FOR UPDATE OF c, ci, i' : ''}`,
      [userId],
    );
    const address = await client.query<AddressRow>(
      `SELECT a.id, a.recipient_name, a.phone, a.line1, a.line2,
              a.city, a.province, a.postal_code
       FROM addresses a JOIN buyer_profiles bp ON bp.id = a.buyer_profile_id
       WHERE bp.user_id = $1 AND a.id = $2`,
      [userId, addressId],
    );
    const voucher = voucherCode
      ? await client.query<VoucherRow>(
          `SELECT v.id, v.promotion_id, p.store_id, p.kind, p.value_amount,
                  p.value_basis_points, p.maximum_discount_amount,
                  p.minimum_subtotal_amount
           FROM vouchers v JOIN promotions p ON p.id = v.promotion_id
           JOIN buyer_profiles bp ON bp.user_id = $1
           WHERE v.code = upper(btrim($2)) AND v.is_active AND p.is_active
             AND application_now() BETWEEN v.starts_at AND v.ends_at
             AND application_now() BETWEEN p.starts_at AND p.ends_at
             AND (v.quota IS NULL OR v.redemption_count < v.quota)
             AND (SELECT count(*) FROM voucher_redemptions r
                  WHERE r.voucher_id = v.id AND r.buyer_profile_id = bp.id) < v.per_buyer_limit
           ${lock ? 'FOR UPDATE OF v' : ''}`,
          [userId, voucherCode],
        )
      : null;
    return {
      lines: lines.rows,
      address: address.rows[0] ?? null,
      voucher: voucher?.rows[0] ?? null,
    };
  }

  calculate(
    data: CheckoutData,
    deliveries: Map<string, DeliveryMethod>,
  ): PriceResult {
    const promotion: PromotionRule | null = data.voucher
      ? {
          kind: data.voucher.kind,
          storeId: data.voucher.store_id,
          valueAmount: data.voucher.value_amount
            ? BigInt(data.voucher.value_amount)
            : null,
          valueBasisPoints: data.voucher.value_basis_points,
          maximumDiscountAmount: data.voucher.maximum_discount_amount
            ? BigInt(data.voucher.maximum_discount_amount)
            : null,
          minimumSubtotalAmount: BigInt(data.voucher.minimum_subtotal_amount),
        }
      : null;
    return this.pricing.calculate(
      data.lines.map((line) => ({
        storeId: line.store_id,
        variantId: line.variant_id,
        unitPrice: BigInt(line.price_amount),
        quantity: line.quantity,
      })),
      deliveries,
      promotion,
    );
  }

  private async createOrder(
    client: PoolClient,
    checkoutId: string,
    data: CheckoutData,
    total: PriceResult['stores'][number],
    method: DeliveryMethod,
    actorUserId: string,
  ) {
    const order = await client.query<{ id: string }>(
      `INSERT INTO orders
       (checkout_group_id, buyer_profile_id, store_id, order_number, status,
        subtotal_amount, discount_amount, shipping_amount, total_amount)
       VALUES ($1,$2,$3,upper('BP-' || substr(replace(gen_random_uuid()::text,'-',''),1,16)),
               'PACKING',$4,$5,$6,$7) RETURNING id`,
      [
        checkoutId,
        data.lines[0].buyer_profile_id,
        total.storeId,
        total.subtotal.toString(),
        total.discount.toString(),
        total.shipping.toString(),
        total.total.toString(),
      ],
    );
    const orderId = order.rows[0].id;
    await client.query(
      `INSERT INTO order_addresses
       (order_id, recipient_name, phone, line1, line2, city, province, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        orderId,
        data.address!.recipient_name,
        data.address!.phone,
        data.address!.line1,
        data.address!.line2,
        data.address!.city,
        data.address!.province,
        data.address!.postal_code,
      ],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, to_status, actor_user_id, reason)
       VALUES ($1,'PACKING',$2,'Checkout completed')`,
      [orderId, actorUserId],
    );
    const intervals: Record<DeliveryMethod, [string, string]> = {
      INSTANT: ['30 minutes', '2 hours'],
      NEXT_DAY: ['12 hours', '36 hours'],
      REGULAR: ['24 hours', '96 hours'],
    };
    const delivery = await client.query<{ id: string }>(
      `INSERT INTO deliveries
       (order_id, method, fee_amount, pickup_deadline_at, delivery_deadline_at)
       VALUES ($1,$2,$3,application_now() + $4::interval,application_now() + $5::interval)
       RETURNING id`,
      [orderId, method, total.shipping.toString(), ...intervals[method]],
    );
    await client.query(
      `INSERT INTO delivery_status_history (delivery_id, to_status, note)
       VALUES ($1,'WAITING_FOR_DRIVER','Checkout completed')`,
      [delivery.rows[0].id],
    );
    return { id: orderId };
  }

  private existing(client: PoolClient, userId: string, key: string) {
    return client
      .query<{ id: string; request_fingerprint: string }>(
        `SELECT cg.id, cg.request_fingerprint FROM checkout_groups cg
         JOIN buyer_profiles bp ON bp.id = cg.buyer_profile_id
         WHERE bp.user_id = $1 AND cg.idempotency_key = $2`,
        [userId, key],
      )
      .then((result) => result.rows[0] ?? null);
  }

  private databaseClient(): Promise<PoolClient> {
    return this.database.connect();
  }
}
