import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';

type IsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  maxRetries?: number;
}

const RETRYABLE_TRANSACTION_ERRORS = new Set(['40001', '40P01']);

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  private readonly statementTimeoutMs: number;

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    const rejectUnauthorized =
      config.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false';
    const ssl = connectionString.includes('sslmode=')
      ? { rejectUnauthorized }
      : undefined;

    this.statementTimeoutMs = Number(
      config.get<string>('DATABASE_STATEMENT_TIMEOUT_MS', '10000'),
    );
    this.pool = new Pool({
      connectionString,
      max: Number(config.get<string>('DATABASE_POOL_MAX', '10')),
      connectionTimeoutMillis: Number(
        config.get<string>('DATABASE_CONNECTION_TIMEOUT_MS', '5000'),
      ),
      idleTimeoutMillis: Number(
        config.get<string>('DATABASE_IDLE_TIMEOUT_MS', '30000'),
      ),
      statement_timeout: this.statementTimeoutMs,
      application_name: 'burhanpedia-api',
      options:
        config.get<string>('NODE_ENV') === 'production'
          ? '-c app.clock_mode=real'
          : undefined,
      ssl,
    });
    this.pool.on('error', (error) =>
      this.logger.error('Unexpected idle PostgreSQL client error', error.stack),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('PostgreSQL connection pool is ready');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }

  query<Row extends QueryResultRow = QueryResultRow>(
    query: string | QueryConfig,
    values?: unknown[],
  ): Promise<QueryResult<Row>> {
    return this.pool.query<Row>(query, values);
  }

  poolStatus(): {
    total: number;
    idle: number;
    waiting: number;
  } {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  connect(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    const isolationLevel = options.isolationLevel ?? 'READ COMMITTED';
    const maxRetries = options.maxRetries ?? 2;

    for (let attempt = 0; ; attempt += 1) {
      const client = await this.pool.connect();
      try {
        await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
        await client.query("SELECT set_config('statement_timeout', $1, true)", [
          `${this.statementTimeoutMs}ms`,
        ]);
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        const code = this.postgresErrorCode(error);
        if (
          !code ||
          !RETRYABLE_TRANSACTION_ERRORS.has(code) ||
          attempt >= maxRetries
        ) {
          throw error;
        }
        await this.waitBeforeRetry(attempt);
      } finally {
        client.release();
      }
    }
  }

  private postgresErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : undefined;
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const delayMs = 20 * 2 ** attempt + Math.floor(Math.random() * 25);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
