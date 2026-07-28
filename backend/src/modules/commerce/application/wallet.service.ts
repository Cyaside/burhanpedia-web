import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TopUpWalletDto, WalletHistoryQueryDto } from './wallet.dto';
import { WalletRepository } from '../infrastructure/wallet.repository';

@Injectable()
export class WalletService {
  private readonly production: boolean;

  constructor(
    private readonly wallets: WalletRepository,
    config: ConfigService,
  ) {
    this.production = config.get<string>('NODE_ENV') === 'production';
  }

  async wallet(userId: string) {
    const wallet = await this.wallets.wallet(userId);
    if (!wallet)
      throw new NotFoundException({ code: 'BUYER_PROFILE_NOT_FOUND' });
    return {
      id: wallet.id,
      balanceAmount: wallet.balance_amount,
      version: wallet.version,
    };
  }

  async topUp(userId: string, dto: TopUpWalletDto, key: string | undefined) {
    if (this.production) {
      throw new ForbiddenException({
        code: 'DEMO_TOP_UP_DISABLED',
        detail: 'Demo top-up is disabled in production.',
      });
    }
    const idempotencyKey = this.key(key);
    const result = await this.wallets.topUp(
      userId,
      BigInt(dto.amount),
      idempotencyKey,
      dto.description ?? 'Demo wallet top-up',
    );
    if (result.status === 'BUYER_NOT_FOUND')
      throw new NotFoundException({ code: result.status });
    if (result.status === 'CONFLICT') {
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_REUSED',
        detail: 'The key was already used with different input.',
      });
    }
    return this.presentEntry(result.entry);
  }

  async history(userId: string, query: WalletHistoryQueryDto) {
    const limit = query.limit ?? 25;
    const cursor = query.cursor ? this.decode(query.cursor) : undefined;
    const rows = await this.wallets.history(userId, limit + 1, cursor);
    const entries = rows.filter((row) => row.id);
    const hasMore = entries.length > limit;
    const page = entries.slice(0, limit);
    const last = hasMore ? page[page.length - 1] : null;
    return {
      balanceAmount: rows[0]?.wallet_balance ?? '0',
      items: page.map((row) => this.presentEntry(row)),
      nextCursor: last
        ? Buffer.from(
            JSON.stringify({
              createdAt: last.created_at.toISOString(),
              id: last.id,
            }),
          ).toString('base64url')
        : null,
    };
  }

  private presentEntry(entry: {
    id: string;
    entry_type: string;
    amount_delta: string;
    balance_after: string;
    description: string | null;
    created_at: Date;
  }) {
    return {
      id: entry.id,
      type: entry.entry_type,
      amountDelta: entry.amount_delta,
      balanceAfter: entry.balance_after,
      description: entry.description,
      createdAt: entry.created_at.toISOString(),
    };
  }

  private key(value: string | undefined): string {
    if (!value || !/^[A-Za-z0-9:_-]{8,100}$/.test(value)) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        detail: 'A valid Idempotency-Key header is required.',
      });
    }
    return value;
  }

  private decode(value: string): { createdAt: string; id: string } {
    try {
      const parsed = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
      if (
        typeof parsed.createdAt !== 'string' ||
        Number.isNaN(Date.parse(parsed.createdAt)) ||
        typeof parsed.id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(parsed.id)
      )
        throw new Error();
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException({
        code: 'INVALID_CURSOR',
        detail: 'The wallet cursor is invalid.',
      });
    }
  }
}
