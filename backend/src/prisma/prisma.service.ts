import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // allow dynamic forwarding of Prisma client properties (keeps existing code working)
  [key: string]: any;
  public prisma: PrismaClient;

  constructor(private config: ConfigService) {
    // don't construct the client here; we'll create it in onModuleInit
  }

  private buildPgConfig(databaseUrl: string) {
    const usesSslMode = /(^|[?&])sslmode=require(&|$)/i.test(databaseUrl);
    const looksLocal = /localhost|127\.0\.0\.1/i.test(databaseUrl);
    const shouldUseSsl =
      usesSslMode || (process.env.NODE_ENV === 'production' && !looksLocal);

    return {
      connectionString: databaseUrl,
      // Supabase/managed Postgres commonly uses self-signed certs.
      // This mirrors typical Node `pg` guidance for those providers.
      ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  async onModuleInit() {
    const dbUrl =
      this.config.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'Missing DATABASE_URL environment variable required by PrismaClient.',
      );
    }

    // Prisma Client v7 (engine type "client") requires either an adapter or an accelerateUrl.
    // We use the official Postgres adapter backed by `pg`.
    const adapter = new PrismaPg(this.buildPgConfig(dbUrl));
    this.prisma = new PrismaClient({ adapter });
    // copy client methods/properties onto this service so `this.prisma.xxx` and
    // `this.xxx` usages both work with minimal code changes.
    Object.assign(this, this.prisma);
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    if (this.prisma) await this.prisma.$disconnect();
  }
}
