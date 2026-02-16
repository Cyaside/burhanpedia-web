import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function buildPgConfig(databaseUrl: string) {
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

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public prisma: PrismaClient;

  constructor(private readonly config: ConfigService) {
    const dbUrl =
      config.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'Missing DATABASE_URL environment variable required by PrismaClient.',
      );
    }

    const adapter = new PrismaPg(buildPgConfig(dbUrl));
    super({ adapter });
    this.prisma = this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
