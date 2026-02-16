import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function buildPgConfig(databaseUrl: string) {
  const parseDbUrl = () => {
    try {
      return new URL(databaseUrl);
    } catch {
      return null;
    }
  };

  const parsedUrl = parseDbUrl();
  const host = parsedUrl?.hostname ?? '';
  const sslMode = parsedUrl?.searchParams.get('sslmode')?.toLowerCase();
  const sslParam = parsedUrl?.searchParams.get('ssl')?.toLowerCase();

  const looksLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local');

  const managedHostPattern =
    /(supabase\.com|supabase\.co|neon\.tech|railway\.app|render\.com|rds\.amazonaws\.com)$/i;
  const isManagedHost = managedHostPattern.test(host);

  const sslRequestedByParams =
    sslMode !== undefined ||
    (sslParam !== undefined && !['0', 'false', 'off'].includes(sslParam));

  const shouldUseSsl =
    sslRequestedByParams ||
    isManagedHost ||
    (process.env.NODE_ENV === 'production' && !looksLocal);

  const rejectUnauthorizedOverride =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  const rejectUnauthorized =
    rejectUnauthorizedOverride !== undefined
      ? rejectUnauthorizedOverride.toLowerCase() === 'true'
      : sslMode === 'verify-ca' || sslMode === 'verify-full';

  return {
    connectionString: databaseUrl,
    ...(shouldUseSsl ? { ssl: { rejectUnauthorized } } : {}),
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
