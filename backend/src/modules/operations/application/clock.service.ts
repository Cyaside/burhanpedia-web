import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class ClockService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async current() {
    const result = await this.database.query<{
      now: Date;
      offsetSeconds: string;
    }>(
      `SELECT application_now() AS now, offset_seconds AS "offsetSeconds"
       FROM system_clock WHERE singleton`,
    );
    return result.rows[0];
  }

  advance(userId: string, days: number) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException({
        code: 'TIME_SIMULATION_DISABLED',
        detail: 'Time simulation is unavailable in production.',
      });
    }
    return this.database.withTransaction(async (client) => {
      const clock = await client.query<{ now: Date; offset_seconds: string }>(
        `UPDATE system_clock
         SET frozen_at = NULL, offset_seconds = offset_seconds + ($1 * 86400),
             updated_at = now()
         WHERE singleton
         RETURNING now() + make_interval(secs => offset_seconds) AS now,
                   offset_seconds`,
        [days],
      );
      await client.query(
        `INSERT INTO audit_logs
         (actor_user_id, action, resource_type, metadata)
         VALUES ($1,'CLOCK_ADVANCED','SYSTEM_CLOCK',$2::jsonb)`,
        [userId, JSON.stringify({ days })],
      );
      await client.query(
        `INSERT INTO background_jobs (job_type, deduplication_key, payload)
         VALUES ('OVERDUE_SCAN',$1,'{}'::jsonb)`,
        [`overdue-scan:${clock.rows[0].offset_seconds}`],
      );
      return {
        now: clock.rows[0].now,
        offsetSeconds: clock.rows[0].offset_seconds,
      };
    });
  }
}
