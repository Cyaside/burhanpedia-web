import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import {
  AppRole,
  SessionMetadata,
  SessionPrincipal,
} from '../domain/identity.types';

interface UserCredentialsRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  roles: AppRole[];
}

interface RefreshSessionRow extends UserCredentialsRow {
  session_id: string;
  family_id: string;
  refresh_token_hash: string;
  active_role: AppRole;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_session_id: string | null;
}

export type RefreshRotationResult =
  | { status: 'rotated'; principal: SessionPrincipal }
  | { status: 'invalid' | 'reused' };

@Injectable()
export class IdentityRepository {
  constructor(private readonly database: DatabaseService) {}

  async createUser(input: {
    email: string;
    name: string;
    passwordHash: string;
    roles: AppRole[];
    metadata: SessionMetadata;
  }): Promise<{ id: string; name: string; email: string; roles: AppRole[] }> {
    return this.database.withTransaction(async (client) => {
      const user = await client.query<{
        id: string;
        name: string;
        email: string;
      }>(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3) RETURNING id, name, email`,
        [input.email, input.name, input.passwordHash],
      );
      const userId = user.rows[0].id;
      for (const role of input.roles) {
        await client.query(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
          [userId, role],
        );
        await this.createProfile(client, userId, role);
      }
      await this.writeAudit(client, {
        actorUserId: userId,
        action: 'IDENTITY_REGISTERED',
        resourceType: 'USER',
        resourceId: userId,
        metadata: input.metadata,
        afterData: { roles: input.roles },
      });
      return { ...user.rows[0], roles: input.roles };
    });
  }

  async findCredentials(email: string): Promise<UserCredentialsRow | null> {
    const result = await this.database.query<UserCredentialsRow>(
      `SELECT u.id, u.email, u.name, u.password_hash,
              array_agg(ur.role ORDER BY ur.role)::app_role[] AS roles
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'ACTIVE'
       WHERE u.email = $1 AND u.status = 'ACTIVE'
       GROUP BY u.id`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async createSession(input: {
    sessionId: string;
    user: UserCredentialsRow;
    activeRole: AppRole;
    familyId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    metadata: SessionMetadata;
  }): Promise<SessionPrincipal> {
    return this.database.withTransaction(async (client) => {
      const session = await client.query<{ id: string }>(
        `INSERT INTO sessions
         (id, user_id, family_id, refresh_token_hash, active_role, expires_at,
          user_agent, ip_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          input.sessionId,
          input.user.id,
          input.familyId,
          input.refreshTokenHash,
          input.activeRole,
          input.expiresAt,
          input.metadata.userAgent,
          input.metadata.ipHash,
        ],
      );
      await this.writeAudit(client, {
        actorUserId: input.user.id,
        action: 'AUTH_LOGIN_SUCCEEDED',
        resourceType: 'SESSION',
        resourceId: session.rows[0].id,
        metadata: input.metadata,
      });
      return this.toPrincipal(input.user, session.rows[0].id, input.activeRole);
    });
  }

  async findRefreshSessionForUpdate(
    client: PoolClient,
    sessionId: string,
  ): Promise<RefreshSessionRow | null> {
    const result = await client.query<RefreshSessionRow>(
      `SELECT s.id AS session_id, s.family_id, s.refresh_token_hash,
              s.active_role, s.expires_at, s.revoked_at,
              s.replaced_by_session_id, u.id, u.email, u.name,
              u.password_hash,
              ARRAY(SELECT ur.role FROM user_roles ur
                    WHERE ur.user_id = u.id AND ur.status = 'ACTIVE'
                    ORDER BY ur.role)::app_role[] AS roles
       FROM sessions s
       JOIN users u ON u.id = s.user_id AND u.status = 'ACTIVE'
       WHERE s.id = $1
       FOR UPDATE OF s`,
      [sessionId],
    );
    return result.rows[0] ?? null;
  }

  async insertRotatedSession(
    client: PoolClient,
    old: RefreshSessionRow,
    nextSessionId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    metadata: SessionMetadata,
  ): Promise<SessionPrincipal> {
    const next = await client.query<{ id: string }>(
      `INSERT INTO sessions
       (id, user_id, family_id, refresh_token_hash, active_role, expires_at,
        user_agent, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        nextSessionId,
        old.id,
        old.family_id,
        refreshTokenHash,
        old.active_role,
        expiresAt,
        metadata.userAgent,
        metadata.ipHash,
      ],
    );
    await client.query(
      `UPDATE sessions SET revoked_at = now(), replaced_by_session_id = $2,
       last_used_at = now() WHERE id = $1`,
      [old.session_id, next.rows[0].id],
    );
    await this.writeAudit(client, {
      actorUserId: old.id,
      action: 'AUTH_TOKEN_ROTATED',
      resourceType: 'SESSION',
      resourceId: next.rows[0].id,
      metadata,
    });
    return this.toPrincipal(old, next.rows[0].id, old.active_role);
  }

  async rotateSession(input: {
    sessionId: string;
    presentedHash: string;
    nextSessionId: string;
    nextHash: string;
    expiresAt: Date;
    metadata: SessionMetadata;
  }): Promise<RefreshRotationResult> {
    return this.database.withTransaction(async (client) => {
      const current = await this.findRefreshSessionForUpdate(
        client,
        input.sessionId,
      );
      if (!current || current.refresh_token_hash !== input.presentedHash) {
        return { status: 'invalid' };
      }
      if (
        current.revoked_at ||
        current.replaced_by_session_id ||
        current.expires_at <= new Date()
      ) {
        await this.revokeFamily(client, current.family_id);
        return { status: 'reused' };
      }
      if (!current.roles.includes(current.active_role)) {
        await this.revokeFamily(client, current.family_id);
        return { status: 'invalid' };
      }
      const principal = await this.insertRotatedSession(
        client,
        current,
        input.nextSessionId,
        input.nextHash,
        input.expiresAt,
        input.metadata,
      );
      return { status: 'rotated', principal };
    });
  }

  async revokeFamily(client: PoolClient, familyId: string): Promise<void> {
    await client.query(
      `UPDATE sessions SET revoked_at = coalesce(revoked_at, now())
       WHERE family_id = $1`,
      [familyId],
    );
  }

  async findPrincipal(sessionId: string): Promise<SessionPrincipal | null> {
    const result = await this.database.query<RefreshSessionRow>(
      `SELECT s.id AS session_id, s.active_role, u.id, u.email, u.name,
              u.password_hash, s.family_id, s.refresh_token_hash, s.expires_at,
              s.revoked_at, s.replaced_by_session_id,
              ARRAY(SELECT ur.role FROM user_roles ur
                    WHERE ur.user_id = u.id AND ur.status = 'ACTIVE'
                    ORDER BY ur.role)::app_role[] AS roles
       FROM sessions s
       JOIN users u ON u.id = s.user_id AND u.status = 'ACTIVE'
       WHERE s.id = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
       `,
      [sessionId],
    );
    const row = result.rows[0];
    if (!row || !row.roles.includes(row.active_role)) return null;
    return this.toPrincipal(row, row.session_id, row.active_role);
  }

  async changeActiveRole(
    principal: SessionPrincipal,
    role: AppRole,
    metadata: SessionMetadata,
  ): Promise<SessionPrincipal> {
    return this.database.withTransaction(async (client) => {
      await client.query(
        'UPDATE sessions SET active_role = $2, last_used_at = now() WHERE id = $1',
        [principal.sessionId, role],
      );
      await this.writeAudit(client, {
        actorUserId: principal.userId,
        action: 'AUTH_ACTIVE_ROLE_CHANGED',
        resourceType: 'SESSION',
        resourceId: principal.sessionId,
        metadata,
        afterData: { role },
      });
      return { ...principal, activeRole: role };
    });
  }

  async revokeSession(
    principal: SessionPrincipal,
    metadata: SessionMetadata,
  ): Promise<void> {
    await this.database.withTransaction(async (client) => {
      await client.query(
        'UPDATE sessions SET revoked_at = coalesce(revoked_at, now()) WHERE id = $1',
        [principal.sessionId],
      );
      await this.writeAudit(client, {
        actorUserId: principal.userId,
        action: 'AUTH_LOGOUT',
        resourceType: 'SESSION',
        resourceId: principal.sessionId,
        metadata,
      });
    });
  }

  private async createProfile(
    client: PoolClient,
    userId: string,
    role: AppRole,
  ): Promise<void> {
    const table: Record<AppRole, string> = {
      [AppRole.BUYER]: 'buyer_profiles',
      [AppRole.SELLER]: 'seller_profiles',
      [AppRole.DRIVER]: 'driver_profiles',
      [AppRole.ADMIN]: 'admin_profiles',
    };
    await client.query(`INSERT INTO ${table[role]} (user_id) VALUES ($1)`, [
      userId,
    ]);
  }

  private toPrincipal(
    user: Pick<UserCredentialsRow, 'id' | 'email' | 'name' | 'roles'>,
    sessionId: string,
    activeRole: AppRole,
  ): SessionPrincipal {
    return {
      userId: user.id,
      sessionId,
      email: user.email,
      name: user.name,
      roles: user.roles,
      activeRole,
    };
  }

  private writeAudit(
    client: PoolClient,
    input: {
      actorUserId: string;
      action: string;
      resourceType: string;
      resourceId: string;
      metadata: SessionMetadata;
      afterData?: object;
    },
  ): Promise<unknown> {
    return client.query(
      `INSERT INTO audit_logs
       (actor_user_id, action, resource_type, resource_id, request_id,
        ip_hash, user_agent, after_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.actorUserId,
        input.action,
        input.resourceType,
        input.resourceId,
        input.metadata.requestId,
        input.metadata.ipHash,
        input.metadata.userAgent,
        input.afterData ?? null,
      ],
    );
  }
}
