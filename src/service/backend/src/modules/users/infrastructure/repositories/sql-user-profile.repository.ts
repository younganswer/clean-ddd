import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IUserProfileRepository } from '@/modules/users/domains/repositories/i.user-profile.repository';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';

const DEFAULT_DUMMY_PROFILE: UserProfileView = {
  userId: 'anonymous',
  displayName: '기본 더미 유저',
  email: 'dummy-default@example.com',
  avatarUrl: 'https://example.com/avatar/default.png',
};

@Injectable()
export class SqlUserProfileRepository implements IUserProfileRepository {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async getProfileByUserId(userId: string): Promise<UserProfileView> {
    const normalized = userId.trim();
    if (!normalized) return DEFAULT_DUMMY_PROFILE;

    const em = this.emForContext();
    const rows = await em.getConnection().execute<
      Array<{
        userId: string;
        displayName: string;
        email: string;
        avatarUrl: string | null;
      }>
    >(
      `select
        u.uuid as "userId",
        u.display_name as "displayName",
        u.email as "email",
        u.avatar_url as "avatarUrl"
      from users u
      where u.uuid = ?
      limit 1`,
      [normalized],
    );

    const row = rows[0];
    if (!row) return DEFAULT_DUMMY_PROFILE;

    return {
      userId: row.userId,
      displayName: row.displayName,
      email: row.email,
      avatarUrl: row.avatarUrl ?? undefined,
    };
  }

  async listProfiles(input: {
    limit: number;
    page: number;
  }): Promise<UserProfileView[]> {
    const limit = Math.min(200, Math.max(1, Number(input.limit ?? 20) || 20));
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const offset = (page - 1) * limit;

    const em = this.emForContext();
    const rows = await em.getConnection().execute<
      Array<{
        userId: string;
        displayName: string;
        email: string;
        avatarUrl: string | null;
      }>
    >(
      `select
        u.uuid as "userId",
        u.display_name as "displayName",
        u.email as "email",
        u.avatar_url as "avatarUrl"
      from users u
      order by u.id asc
      limit ? offset ?`,
      [limit, Math.max(0, offset)],
    );

    return rows.map((row) => ({
      userId: row.userId,
      displayName: row.displayName,
      email: row.email,
      avatarUrl: row.avatarUrl ?? undefined,
    }));
  }

  async countProfiles(): Promise<number> {
    const em = this.emForContext();
    const rows = await em
      .getConnection()
      .execute<Array<{ total: string }>>('select count(*) as total from users');

    const raw = rows[0]?.total;
    return Number(raw) || 0;
  }
}
