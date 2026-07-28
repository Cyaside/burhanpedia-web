import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../../database/database.service';

interface WalletEntryRow {
  id: string;
  entry_type: string;
  amount_delta: string;
  balance_after: string;
  description: string | null;
  created_at: Date;
}

@Injectable()
export class WalletRepository {
  constructor(private readonly database: DatabaseService) {}

  async wallet(userId: string) {
    const result = await this.database.query<{
      id: string;
      balance_amount: string;
      version: number;
    }>(
      `INSERT INTO wallet_accounts (buyer_profile_id)
       SELECT id FROM buyer_profiles WHERE user_id = $1
       ON CONFLICT (buyer_profile_id) DO UPDATE SET updated_at = wallet_accounts.updated_at
       RETURNING id, balance_amount, version`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async topUp(
    userId: string,
    amount: bigint,
    idempotencyKey: string,
    description: string,
  ) {
    return this.database.withTransaction(async (client) => {
      const wallet = await client.query<{
        id: string;
        balance_amount: string;
        version: number;
      }>(
        `INSERT INTO wallet_accounts (buyer_profile_id)
         SELECT id FROM buyer_profiles WHERE user_id = $1
         ON CONFLICT (buyer_profile_id) DO UPDATE SET updated_at = wallet_accounts.updated_at
         RETURNING id, balance_amount, version`,
        [userId],
      );
      if (!wallet.rows[0]) return { status: 'BUYER_NOT_FOUND' as const };
      await client.query(
        'SELECT id FROM wallet_accounts WHERE id = $1 FOR UPDATE',
        [wallet.rows[0].id],
      );
      const existing = await client.query<WalletEntryRow>(
        `SELECT id, entry_type, amount_delta, balance_after, description, created_at
         FROM wallet_ledger_entries WHERE wallet_account_id = $1 AND idempotency_key = $2`,
        [wallet.rows[0].id, idempotencyKey],
      );
      if (existing.rows[0]) {
        return BigInt(existing.rows[0].amount_delta) === amount
          ? { status: 'OK' as const, entry: existing.rows[0] }
          : { status: 'CONFLICT' as const };
      }
      const updated = await client.query<{ balance_amount: string }>(
        `UPDATE wallet_accounts SET balance_amount = balance_amount + $2, version = version + 1
         WHERE id = $1 RETURNING balance_amount`,
        [wallet.rows[0].id, amount.toString()],
      );
      const entry = await client.query<WalletEntryRow>(
        `INSERT INTO wallet_ledger_entries
         (wallet_account_id, entry_type, amount_delta, balance_after,
          reference_type, reference_id, idempotency_key, description)
         VALUES ($1, 'TOP_UP', $2, $3, 'DEMO_TOP_UP', $4, $5, $6)
         RETURNING id, entry_type, amount_delta, balance_after, description, created_at`,
        [
          wallet.rows[0].id,
          amount.toString(),
          updated.rows[0].balance_amount,
          randomUUID(),
          idempotencyKey,
          description,
        ],
      );
      return { status: 'OK' as const, entry: entry.rows[0] };
    });
  }

  async history(
    userId: string,
    limit: number,
    cursor?: { createdAt: string; id: string },
  ) {
    const result = await this.database.query<
      WalletEntryRow & { wallet_balance: string }
    >(
      `SELECT e.id, e.entry_type, e.amount_delta, e.balance_after,
              e.description, e.created_at, w.balance_amount AS wallet_balance
       FROM buyer_profiles bp
       JOIN wallet_accounts w ON w.buyer_profile_id = bp.id
       LEFT JOIN wallet_ledger_entries e ON e.wallet_account_id = w.id
       WHERE bp.user_id = $1
         AND ($3::timestamptz IS NULL OR (e.created_at, e.id) < ($3, $4::uuid))
       ORDER BY e.created_at DESC NULLS LAST, e.id DESC
       LIMIT $2`,
      [userId, limit, cursor?.createdAt ?? null, cursor?.id ?? null],
    );
    return result.rows;
  }
}
