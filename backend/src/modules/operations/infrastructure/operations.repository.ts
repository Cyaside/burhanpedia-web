import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { OrderStateMachine } from '../domain/order-state-machine';
import type { OrderStatus } from '../domain/order-state-machine';

@Injectable()
export class OperationsRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly states: OrderStateMachine,
  ) {}

  async sellerOrders(userId: string) {
    const result = await this.database.query(
      `SELECT o.id, o.order_number AS "number", o.status,
              o.total_amount AS "totalAmount", o.placed_at AS "placedAt",
              d.method AS "deliveryMethod", d.delivery_deadline_at AS "deliveryDeadlineAt"
       FROM orders o JOIN stores s ON s.id = o.store_id
       JOIN seller_profiles sp ON sp.id = s.seller_profile_id
       JOIN deliveries d ON d.order_id = o.id
       WHERE sp.user_id = $1
       ORDER BY o.placed_at DESC, o.id DESC LIMIT 100`,
      [userId],
    );
    return result.rows;
  }

  async buyerOrders(userId: string) {
    const result = await this.database.query(
      `SELECT o.id, o.order_number AS "number", o.status,
              o.total_amount AS "totalAmount", o.placed_at AS "placedAt",
              s.name AS "storeName", d.method AS "deliveryMethod"
       FROM orders o JOIN buyer_profiles bp ON bp.id = o.buyer_profile_id
       JOIN stores s ON s.id = o.store_id JOIN deliveries d ON d.order_id = o.id
       WHERE bp.user_id = $1 ORDER BY o.placed_at DESC, o.id DESC LIMIT 100`,
      [userId],
    );
    return result.rows;
  }

  processOrder(userId: string, orderId: string) {
    this.states.assertTransition('PACKING', 'AWAITING_DRIVER');
    return this.database.withTransaction(async (client) => {
      const order = await client.query<{
        id: string;
        delivery_id: string;
        deadline: Date;
      }>(
        `UPDATE orders o SET status = 'AWAITING_DRIVER', version = o.version + 1
         FROM stores s, seller_profiles sp, deliveries d
         WHERE o.id = $2 AND o.status = 'PACKING' AND o.store_id = s.id
           AND s.seller_profile_id = sp.id AND sp.user_id = $1 AND d.order_id = o.id
         RETURNING o.id, d.id AS delivery_id, d.delivery_deadline_at AS deadline`,
        [userId, orderId],
      );
      if (!order.rows[0]) return null;
      await client.query(
        `INSERT INTO order_status_history
         (order_id, from_status, to_status, actor_user_id, reason)
         VALUES ($1,'PACKING','AWAITING_DRIVER',$2,'Seller finished packing')`,
        [orderId, userId],
      );
      await client.query(
        `INSERT INTO delivery_jobs (order_id, delivery_id)
         VALUES ($1,$2) ON CONFLICT (order_id) DO NOTHING`,
        [orderId, order.rows[0].delivery_id],
      );
      await client.query(
        `INSERT INTO background_jobs (job_type, deduplication_key, payload, run_at)
         VALUES ('ORDER_OVERDUE',$1,$2::jsonb,$3)
         ON CONFLICT (deduplication_key) DO NOTHING`,
        [
          `overdue:${orderId}`,
          JSON.stringify({ orderId }),
          order.rows[0].deadline,
        ],
      );
      await this.outbox(client, 'ORDER', orderId, 'ORDER_AWAITING_DRIVER', {
        orderId,
      });
      return { id: orderId, status: 'AWAITING_DRIVER' };
    });
  }

  async availableJobs(
    limit: number,
    cursor?: { createdAt: string; id: string },
  ) {
    const result = await this.database.query(
      `SELECT j.id, j.order_id AS "orderId", j.version,
              j.created_at AS "createdAt",
              d.method, d.fee_amount AS "feeAmount",
              d.pickup_deadline_at AS "pickupDeadlineAt",
              d.delivery_deadline_at AS "deliveryDeadlineAt",
              s.name AS "storeName", a.city, a.province
       FROM delivery_jobs j JOIN deliveries d ON d.id = j.delivery_id
       JOIN orders o ON o.id = j.order_id JOIN stores s ON s.id = o.store_id
       JOIN order_addresses a ON a.order_id = o.id
       WHERE j.status = 'AVAILABLE' AND o.status = 'AWAITING_DRIVER'
         AND ($2::timestamptz IS NULL OR (j.created_at, j.id) > ($2,$3::uuid))
       ORDER BY j.created_at, j.id LIMIT $1`,
      [limit, cursor?.createdAt ?? null, cursor?.id ?? null],
    );
    return result.rows;
  }

  claimJob(userId: string, jobId: string, idempotencyKey: string) {
    this.states.assertTransition('AWAITING_DRIVER', 'DRIVER_ASSIGNED');
    return this.database.withTransaction(async (client) => {
      const driver = await client.query<{ id: string }>(
        'SELECT id FROM driver_profiles WHERE user_id = $1',
        [userId],
      );
      if (!driver.rows[0]) return { status: 'DRIVER_NOT_FOUND' as const };
      const prior = await client.query<{
        id: string;
        delivery_id: string;
        order_id: string;
      }>(
        `SELECT id, delivery_id, order_id FROM delivery_jobs
         WHERE claim_idempotency_key = $1 AND claimed_by = $2`,
        [idempotencyKey, driver.rows[0].id],
      );
      if (prior.rows[0]) {
        return prior.rows[0].id === jobId
          ? { status: 'OK' as const, ...prior.rows[0] }
          : { status: 'IDEMPOTENCY_CONFLICT' as const };
      }
      const job = await client.query<{
        id: string;
        delivery_id: string;
        order_id: string;
      }>(
        `UPDATE delivery_jobs SET status = 'CLAIMED', claimed_by = $2,
                claimed_at = application_now(), claim_idempotency_key = $3, version = version + 1
         WHERE id = $1 AND status = 'AVAILABLE' AND claimed_by IS NULL
         RETURNING id, delivery_id, order_id`,
        [jobId, driver.rows[0].id, idempotencyKey],
      );
      if (!job.rows[0]) return { status: 'JOB_ALREADY_CLAIMED' as const };
      const order = await client.query(
        `UPDATE orders SET status = 'DRIVER_ASSIGNED', version = version + 1
         WHERE id = $1 AND status = 'AWAITING_DRIVER'`,
        [job.rows[0].order_id],
      );
      if (order.rowCount !== 1)
        throw new Error('Delivery job and order state diverged');
      await client.query(
        `UPDATE deliveries SET status = 'CLAIMED', driver_profile_id = $2,
                claimed_at = application_now(), version = version + 1 WHERE id = $1`,
        [job.rows[0].delivery_id, driver.rows[0].id],
      );
      await this.histories(
        client,
        job.rows[0].order_id,
        job.rows[0].delivery_id,
        'AWAITING_DRIVER',
        'DRIVER_ASSIGNED',
        'WAITING_FOR_DRIVER',
        'CLAIMED',
        userId,
        'Driver claimed delivery',
      );
      await this.outbox(
        client,
        'ORDER',
        job.rows[0].order_id,
        'DRIVER_ASSIGNED',
        { jobId },
      );
      return { status: 'OK' as const, ...job.rows[0] };
    });
  }

  pickup(userId: string, deliveryId: string) {
    this.states.assertTransition('DRIVER_ASSIGNED', 'IN_TRANSIT');
    return this.deliveryTransition(userId, deliveryId, {
      fromOrder: 'DRIVER_ASSIGNED',
      toOrder: 'IN_TRANSIT',
      fromDelivery: 'CLAIMED',
      toDelivery: 'IN_TRANSIT',
      timestamp: 'picked_up_at',
      event: 'DELIVERY_PICKED_UP',
      note: 'Driver picked up order',
    });
  }

  completeDelivery(userId: string, deliveryId: string) {
    this.states.assertTransition('IN_TRANSIT', 'DELIVERED');
    return this.database.withTransaction(async (client) => {
      const completed = await client.query<{ amount: string }>(
        `SELECT e.amount FROM driver_earnings e
         JOIN driver_profiles dp ON dp.id = e.driver_profile_id
         WHERE e.delivery_id = $2 AND dp.user_id = $1`,
        [userId, deliveryId],
      );
      if (completed.rows[0]) {
        return {
          id: deliveryId,
          status: 'DELIVERED',
          earningAmount: completed.rows[0].amount,
        };
      }
      const moved = await this.transitionDelivery(client, userId, deliveryId, {
        fromOrder: 'IN_TRANSIT',
        toOrder: 'DELIVERED',
        fromDelivery: 'IN_TRANSIT',
        toDelivery: 'DELIVERED',
        timestamp: 'delivered_at',
        event: 'DELIVERY_DELIVERED',
        note: 'Driver delivered order',
      });
      if (!moved) return null;
      const wallet = await client.query<{ id: string; balance_amount: string }>(
        `INSERT INTO driver_wallet_accounts (driver_profile_id)
         VALUES ($1) ON CONFLICT (driver_profile_id)
         DO UPDATE SET updated_at = driver_wallet_accounts.updated_at
         RETURNING id, balance_amount`,
        [moved.driverId],
      );
      await client.query(
        'SELECT id FROM driver_wallet_accounts WHERE id = $1 FOR UPDATE',
        [wallet.rows[0].id],
      );
      const earning = this.driverEarning(moved.method);
      const balance = BigInt(wallet.rows[0].balance_amount) + earning;
      await client.query(
        'UPDATE driver_wallet_accounts SET balance_amount = $2, version = version + 1 WHERE id = $1',
        [wallet.rows[0].id, balance.toString()],
      );
      const entry = await client.query<{ id: string }>(
        `INSERT INTO driver_wallet_entries
         (wallet_account_id, amount, balance_after, delivery_id, idempotency_key)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [
          wallet.rows[0].id,
          earning.toString(),
          balance.toString(),
          deliveryId,
          `earning:${deliveryId}`,
        ],
      );
      await client.query(
        `INSERT INTO driver_earnings
         (driver_profile_id, delivery_id, amount, wallet_entry_id)
         VALUES ($1,$2,$3,$4)`,
        [moved.driverId, deliveryId, earning.toString(), entry.rows[0].id],
      );
      await client.query(
        `UPDATE delivery_jobs SET status = 'COMPLETED', completed_at = application_now(),
                version = version + 1 WHERE delivery_id = $1`,
        [deliveryId],
      );
      return {
        id: deliveryId,
        status: 'DELIVERED',
        earningAmount: String(earning),
      };
    });
  }

  async driverEarnings(userId: string) {
    const wallet = await this.database.query(
      `SELECT w.id, coalesce(w.balance_amount,0)::text AS "balanceAmount",
              coalesce(w.currency,'IDR') AS currency,
              coalesce(jsonb_agg(jsonb_build_object(
                'id', e.id, 'deliveryId', e.delivery_id,
                'amount', e.amount::text, 'earnedAt', e.earned_at
              ) ORDER BY e.earned_at DESC, e.id DESC)
              FILTER (WHERE e.id IS NOT NULL), '[]'::jsonb) AS entries
       FROM driver_profiles dp
       LEFT JOIN driver_wallet_accounts w ON w.driver_profile_id = dp.id
       LEFT JOIN driver_earnings e ON e.driver_profile_id = dp.id
       WHERE dp.user_id = $1 GROUP BY w.id`,
      [userId],
    );
    return (
      wallet.rows[0] ?? { balanceAmount: '0', currency: 'IDR', entries: [] }
    );
  }

  confirmOrder(userId: string, orderId: string) {
    this.states.assertTransition('DELIVERED', 'COMPLETED');
    return this.database.withTransaction(async (client) => {
      const order = await client.query(
        `UPDATE orders o SET status = 'COMPLETED', completed_at = application_now(), version = version + 1
         FROM buyer_profiles bp
         WHERE o.id = $2 AND o.buyer_profile_id = bp.id AND bp.user_id = $1
           AND o.status = 'DELIVERED' RETURNING o.id`,
        [userId, orderId],
      );
      if (!order.rows[0]) return null;
      await client.query(
        `INSERT INTO order_status_history
         (order_id, from_status, to_status, actor_user_id, reason)
         VALUES ($1,'DELIVERED','COMPLETED',$2,'Buyer confirmed delivery')`,
        [orderId, userId],
      );
      await this.outbox(client, 'ORDER', orderId, 'ORDER_COMPLETED', {
        orderId,
      });
      return { id: orderId, status: 'COMPLETED' };
    });
  }

  async orderDetails(userId: string, orderId: string) {
    const result = await this.database.query(
      `SELECT o.id, o.order_number AS "number", o.status,
              o.subtotal_amount AS "subtotalAmount", o.discount_amount AS "discountAmount",
              o.shipping_amount AS "shippingAmount", o.total_amount AS "totalAmount",
              o.placed_at AS "placedAt", s.name AS "storeName",
              jsonb_agg(DISTINCT jsonb_build_object(
                'id', i.id, 'productName', i.product_name, 'variantName', i.variant_name,
                'quantity', i.quantity, 'unitPriceAmount', i.unit_price_amount::text,
                'lineTotalAmount', i.line_total_amount::text
              )) AS items,
              (SELECT jsonb_agg(jsonb_build_object(
                'from', h.from_status, 'to', h.to_status, 'reason', h.reason,
                'createdAt', h.created_at) ORDER BY h.event_sequence)
               FROM order_status_history h WHERE h.order_id = o.id) AS history
       FROM orders o JOIN stores s ON s.id = o.store_id
       JOIN order_items i ON i.order_id = o.id
       JOIN buyer_profiles bp ON bp.id = o.buyer_profile_id
       WHERE bp.user_id = $1 AND o.id = $2 GROUP BY o.id, s.name`,
      [userId, orderId],
    );
    return result.rows[0] ?? null;
  }

  private deliveryTransition(
    userId: string,
    deliveryId: string,
    transition: DeliveryTransition,
  ) {
    return this.database.withTransaction((client) =>
      this.transitionDelivery(client, userId, deliveryId, transition),
    );
  }

  private async transitionDelivery(
    client: import('pg').PoolClient,
    userId: string,
    deliveryId: string,
    transition: DeliveryTransition,
  ) {
    const delivery = await client.query<{
      order_id: string;
      driver_id: string;
      method: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
    }>(
      `UPDATE deliveries d SET status = $4, ${transition.timestamp} = application_now(),
              version = d.version + 1
       FROM driver_profiles dp, orders o
       WHERE d.id = $2 AND d.driver_profile_id = dp.id AND dp.user_id = $1
         AND d.status = $3 AND o.id = d.order_id AND o.status = $5
       RETURNING d.order_id, d.driver_profile_id AS driver_id, d.method`,
      [
        userId,
        deliveryId,
        transition.fromDelivery,
        transition.toDelivery,
        transition.fromOrder,
      ],
    );
    if (!delivery.rows[0]) return null;
    const order = await client.query(
      'UPDATE orders SET status = $2, version = version + 1 WHERE id = $1 AND status = $3',
      [delivery.rows[0].order_id, transition.toOrder, transition.fromOrder],
    );
    if (order.rowCount !== 1) {
      throw new Error('Delivery and order state diverged');
    }
    await this.histories(
      client,
      delivery.rows[0].order_id,
      deliveryId,
      transition.fromOrder,
      transition.toOrder,
      transition.fromDelivery,
      transition.toDelivery,
      userId,
      transition.note,
    );
    await this.outbox(client, 'DELIVERY', deliveryId, transition.event, {
      deliveryId,
    });
    return {
      id: deliveryId,
      orderId: delivery.rows[0].order_id,
      status: transition.toDelivery,
      driverId: delivery.rows[0].driver_id,
      method: delivery.rows[0].method,
    };
  }

  private driverEarning(method: 'INSTANT' | 'NEXT_DAY' | 'REGULAR'): bigint {
    return { INSTANT: 20_000n, NEXT_DAY: 12_000n, REGULAR: 8_000n }[method];
  }

  private async histories(
    client: import('pg').PoolClient,
    orderId: string,
    deliveryId: string,
    fromOrder: OrderStatus,
    toOrder: OrderStatus,
    fromDelivery: string,
    toDelivery: string,
    actorUserId: string,
    note: string,
  ) {
    await client.query(
      `INSERT INTO order_status_history
       (order_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1,$2,$3,$4,$5)`,
      [orderId, fromOrder, toOrder, actorUserId, note],
    );
    await client.query(
      `INSERT INTO delivery_status_history
       (delivery_id, from_status, to_status, actor_user_id, note)
       VALUES ($1,$2,$3,$4,$5)`,
      [deliveryId, fromDelivery, toDelivery, actorUserId, note],
    );
  }

  private outbox(
    client: import('pg').PoolClient,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: object,
  ) {
    return client.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1,$2,$3,$4::jsonb)`,
      [aggregateType, aggregateId, eventType, JSON.stringify(payload)],
    );
  }
}

interface DeliveryTransition {
  fromOrder: OrderStatus;
  toOrder: OrderStatus;
  fromDelivery: string;
  toDelivery: string;
  timestamp: 'picked_up_at' | 'delivered_at';
  event: string;
  note: string;
}
