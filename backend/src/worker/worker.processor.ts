import { Injectable, Logger } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { OrderStateMachine } from '../modules/operations/domain/order-state-machine';
import type { OrderStatus } from '../modules/operations/domain/order-state-machine';

interface ClaimedJob {
  id: string;
  job_type: string;
  payload: { orderId?: string };
  attempts: number;
  max_attempts: number;
}

interface ClaimedOutbox {
  id: string;
  attempts: number;
}

@Injectable()
export class WorkerProcessor {
  private readonly logger = new Logger(WorkerProcessor.name);
  private readonly workerId = `worker-${process.pid}`;

  constructor(
    private readonly database: DatabaseService,
    private readonly states: OrderStateMachine,
  ) {}

  async runOnce(): Promise<{ jobs: number; outbox: number }> {
    await this.recoverExhaustedLocks();
    let jobs = 0;
    for (let job = await this.claimJob(); job; job = await this.claimJob()) {
      jobs += 1;
      try {
        await this.processJob(job);
        await this.completeJob(job.id);
      } catch (error) {
        await this.failJob(job, error);
      }
    }

    let outbox = 0;
    while (await this.publishOne()) outbox += 1;
    return { jobs, outbox };
  }

  private claimJob(): Promise<ClaimedJob | null> {
    return this.database.withTransaction(async (client) => {
      const result = await client.query<ClaimedJob>(
        `SELECT id, job_type, payload, attempts, max_attempts
         FROM background_jobs
         WHERE ((status IN ('PENDING','FAILED') AND run_at <= application_now())
                OR (status = 'RUNNING' AND locked_at < now() - interval '5 minutes'))
           AND attempts < max_attempts
         ORDER BY run_at, created_at, id
         FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      const job = result.rows[0];
      if (!job) return null;
      await client.query(
        `UPDATE background_jobs SET status = 'RUNNING', attempts = attempts + 1,
                locked_at = now(), locked_by = $2 WHERE id = $1`,
        [job.id, this.workerId],
      );
      return { ...job, attempts: job.attempts + 1 };
    });
  }

  private async processJob(job: ClaimedJob): Promise<void> {
    if (job.job_type === 'ORDER_OVERDUE') {
      if (!job.payload.orderId) throw new Error('ORDER_OVERDUE lacks orderId');
      await this.refundOverdue(job.payload.orderId);
      return;
    }
    if (job.job_type === 'OVERDUE_SCAN') {
      const overdue = await this.database.query<{ id: string }>(
        `SELECT o.id FROM orders o JOIN deliveries d ON d.order_id = o.id
         WHERE o.status IN ('AWAITING_DRIVER','DRIVER_ASSIGNED','IN_TRANSIT')
           AND d.delivery_deadline_at <= application_now()
         ORDER BY d.delivery_deadline_at, o.id LIMIT 500`,
      );
      for (const order of overdue.rows) await this.refundOverdue(order.id);
      return;
    }
    throw new Error(`Unsupported job type: ${job.job_type}`);
  }

  private refundOverdue(orderId: string): Promise<void> {
    return this.database.withTransaction(async (client) => {
      const order = await client.query<{
        status: OrderStatus;
        total_amount: string;
        checkout_group_id: string;
        buyer_profile_id: string;
      }>(
        `SELECT status, total_amount, checkout_group_id, buyer_profile_id
         FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      );
      const current = order.rows[0];
      if (
        !current ||
        ['REFUNDED', 'COMPLETED', 'CANCELED'].includes(current.status)
      )
        return;
      if (current.status === 'RETURNED') {
        await this.issueRefund(client, orderId, current);
        return;
      }
      if (
        !['AWAITING_DRIVER', 'DRIVER_ASSIGNED', 'IN_TRANSIT'].includes(
          current.status,
        )
      )
        return;

      this.states.assertTransition(current.status, 'RETURNED');
      const delivery = await client.query<{ id: string; status: string }>(
        'SELECT id, status FROM deliveries WHERE order_id = $1 FOR UPDATE',
        [orderId],
      );
      await client.query(
        `UPDATE orders SET status = 'RETURNED', version = version + 1 WHERE id = $1`,
        [orderId],
      );
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, reason)
         VALUES ($1,$2,'RETURNED','Delivery deadline exceeded')`,
        [orderId, current.status],
      );
      if (delivery.rows[0]) {
        await client.query(
          `UPDATE deliveries SET status = 'RETURNED', version = version + 1 WHERE id = $1`,
          [delivery.rows[0].id],
        );
        await client.query(
          `INSERT INTO delivery_status_history (delivery_id, from_status, to_status, note)
           VALUES ($1,$2,'RETURNED','Delivery deadline exceeded')`,
          [delivery.rows[0].id, delivery.rows[0].status],
        );
        await client.query(
          `UPDATE delivery_jobs SET status = 'CANCELED', version = version + 1
           WHERE delivery_id = $1 AND status IN ('AVAILABLE','CLAIMED')`,
          [delivery.rows[0].id],
        );
      }
      await client.query(
        `WITH released AS (
           UPDATE inventory_reservations r SET status = 'RELEASED', updated_at = now()
           FROM order_items i
           WHERE r.order_item_id = i.id AND i.order_id = $1 AND r.status = 'CONSUMED'
           RETURNING r.variant_id, r.quantity
         ), restored AS (
           SELECT variant_id, sum(quantity)::integer AS quantity FROM released GROUP BY variant_id
         )
         UPDATE inventories i SET on_hand = i.on_hand + restored.quantity, version = i.version + 1
         FROM restored WHERE i.variant_id = restored.variant_id`,
        [orderId],
      );
      await this.issueRefund(client, orderId, current);
    });
  }

  private async issueRefund(
    client: PoolClient,
    orderId: string,
    order: {
      status: OrderStatus;
      total_amount: string;
      checkout_group_id: string;
      buyer_profile_id: string;
    },
  ): Promise<void> {
    this.states.assertTransition('RETURNED', 'REFUNDED');
    const prior = await client.query(
      'SELECT id FROM refunds WHERE order_id = $1',
      [orderId],
    );
    if (prior.rows[0]) {
      await client.query(
        `UPDATE orders SET status = 'REFUNDED', version = version + 1
         WHERE id = $1 AND status = 'RETURNED'`,
        [orderId],
      );
      return;
    }
    const payment = await client.query<{
      id: string;
      wallet_account_id: string;
      amount: string;
      balance_amount: string;
    }>(
      `SELECT p.id, p.wallet_account_id, p.amount, w.balance_amount
       FROM payments p JOIN wallet_accounts w ON w.id = p.wallet_account_id
       WHERE p.checkout_group_id = $1 FOR UPDATE OF p, w`,
      [order.checkout_group_id],
    );
    if (!payment.rows[0])
      throw new Error(`Payment missing for order ${orderId}`);
    const amount = BigInt(order.total_amount);
    if (amount > 0n) {
      const balance = BigInt(payment.rows[0].balance_amount) + amount;
      await client.query(
        `INSERT INTO refunds (payment_id, order_id, amount, reason, idempotency_key)
         VALUES ($1,$2,$3,'Delivery deadline exceeded',$4)`,
        [
          payment.rows[0].id,
          orderId,
          amount.toString(),
          `refund:order:${orderId}`,
        ],
      );
      await client.query(
        `UPDATE wallet_accounts SET balance_amount = $2, version = version + 1 WHERE id = $1`,
        [payment.rows[0].wallet_account_id, balance.toString()],
      );
      await client.query(
        `INSERT INTO wallet_ledger_entries
         (wallet_account_id, entry_type, amount_delta, balance_after,
          reference_type, reference_id, idempotency_key, description)
         VALUES ($1,'REFUND',$2,$3,'ORDER',$4,$5,'Automatic overdue refund')`,
        [
          payment.rows[0].wallet_account_id,
          amount.toString(),
          balance.toString(),
          orderId,
          `refund:order:${orderId}`,
        ],
      );
      await client.query(
        `UPDATE payments SET status = CASE
           WHEN (SELECT coalesce(sum(amount),0) FROM refunds WHERE payment_id = $1) >= amount
           THEN 'REFUNDED' ELSE status END WHERE id = $1`,
        [payment.rows[0].id],
      );
    }
    await client.query(
      `UPDATE orders SET status = 'REFUNDED', version = version + 1 WHERE id = $1`,
      [orderId],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, reason)
       VALUES ($1,'RETURNED','REFUNDED','Automatic overdue refund')`,
      [orderId],
    );
    await client.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
       VALUES ('ORDER',$1,'ORDER_REFUNDED',$2::jsonb)`,
      [orderId, JSON.stringify({ orderId, reason: 'OVERDUE' })],
    );
  }

  private completeJob(id: string) {
    return this.database.query(
      `UPDATE background_jobs SET status = 'COMPLETED', completed_at = now(),
              locked_at = NULL, locked_by = NULL WHERE id = $1`,
      [id],
    );
  }

  private failJob(job: ClaimedJob, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Job ${job.id} failed: ${message}`);
    return this.database.withTransaction(async (client) => {
      const dead = job.attempts >= job.max_attempts;
      await client.query(
        `UPDATE background_jobs SET status = $2, last_error = $3,
                run_at = application_now() + make_interval(secs => least(300, power(2,$4)::integer)),
                locked_at = NULL, locked_by = NULL WHERE id = $1`,
        [
          job.id,
          dead ? 'DEAD' : 'FAILED',
          message.slice(0, 1000),
          job.attempts,
        ],
      );
      if (dead) {
        await client.query(
          `INSERT INTO dead_letter_events
           (source_kind, source_id, event_type, payload, attempts, final_error)
           SELECT 'JOB', id, job_type, payload, attempts, $2 FROM background_jobs WHERE id = $1
           ON CONFLICT (source_kind, source_id) DO NOTHING`,
          [job.id, message.slice(0, 1000)],
        );
      }
    });
  }

  private async publishOne(): Promise<boolean> {
    const event = await this.database.withTransaction(async (client) => {
      const result = await client.query<ClaimedOutbox>(
        `SELECT id, attempts FROM outbox_events
         WHERE ((status IN ('PENDING','FAILED') AND available_at <= application_now())
                OR (status = 'PROCESSING' AND locked_at < now() - interval '5 minutes'))
           AND attempts < 8
         ORDER BY available_at, created_at, id FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      if (!result.rows[0]) return null;
      await client.query(
        `UPDATE outbox_events SET status = 'PROCESSING', attempts = attempts + 1,
                locked_at = now(), locked_by = $2 WHERE id = $1`,
        [result.rows[0].id, this.workerId],
      );
      return { ...result.rows[0], attempts: result.rows[0].attempts + 1 };
    });
    if (!event) return false;
    try {
      await this.publish(event.id);
    } catch (error) {
      await this.failOutbox(event, error);
    }
    return true;
  }

  private publish(eventId: string): Promise<void> {
    return this.database.withTransaction(async (client) => {
      await client.query(
        `INSERT INTO published_events
         (outbox_event_id, aggregate_type, aggregate_id, event_type, payload)
         SELECT id, aggregate_type, aggregate_id, event_type, payload
         FROM outbox_events WHERE id = $1
         ON CONFLICT (outbox_event_id) DO NOTHING`,
        [eventId],
      );
      await client.query(
        `UPDATE outbox_events SET status = 'PUBLISHED', published_at = now(),
                locked_at = NULL, locked_by = NULL, last_error = NULL
         WHERE id = $1`,
        [eventId],
      );
    });
  }

  private failOutbox(event: ClaimedOutbox, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return this.database.withTransaction(async (client) => {
      const dead = event.attempts >= 8;
      await client.query(
        `UPDATE outbox_events SET status = $2, last_error = $3,
                available_at = application_now() + make_interval(secs => least(300, power(2,$4)::integer)),
                locked_at = NULL, locked_by = NULL WHERE id = $1`,
        [
          event.id,
          dead ? 'DEAD' : 'FAILED',
          message.slice(0, 1000),
          event.attempts,
        ],
      );
      if (dead) {
        await client.query(
          `INSERT INTO dead_letter_events
           (source_kind, source_id, event_type, payload, attempts, final_error)
           SELECT 'OUTBOX', id, event_type, payload, attempts, $2
           FROM outbox_events WHERE id = $1
           ON CONFLICT (source_kind, source_id) DO NOTHING`,
          [event.id, message.slice(0, 1000)],
        );
      }
    });
  }

  private recoverExhaustedLocks(): Promise<void> {
    return this.database.withTransaction(async (client) => {
      const jobs = await client.query<{ id: string }>(
        `UPDATE background_jobs SET status = 'DEAD',
                last_error = coalesce(last_error,'Worker stopped during final attempt'),
                locked_at = NULL, locked_by = NULL
         WHERE status = 'RUNNING' AND attempts >= max_attempts
           AND locked_at < now() - interval '5 minutes' RETURNING id`,
      );
      for (const job of jobs.rows) {
        await client.query(
          `INSERT INTO dead_letter_events
           (source_kind, source_id, event_type, payload, attempts, final_error)
           SELECT 'JOB', id, job_type, payload, attempts, last_error
           FROM background_jobs WHERE id = $1
           ON CONFLICT (source_kind, source_id) DO NOTHING`,
          [job.id],
        );
      }
      const events = await client.query<{ id: string }>(
        `UPDATE outbox_events SET status = 'DEAD',
                last_error = coalesce(last_error,'Worker stopped during final attempt'),
                locked_at = NULL, locked_by = NULL
         WHERE status = 'PROCESSING' AND attempts >= 8
           AND locked_at < now() - interval '5 minutes' RETURNING id`,
      );
      for (const event of events.rows) {
        await client.query(
          `INSERT INTO dead_letter_events
           (source_kind, source_id, event_type, payload, attempts, final_error)
           SELECT 'OUTBOX', id, event_type, payload, attempts, last_error
           FROM outbox_events WHERE id = $1
           ON CONFLICT (source_kind, source_id) DO NOTHING`,
          [event.id],
        );
      }
    });
  }
}
