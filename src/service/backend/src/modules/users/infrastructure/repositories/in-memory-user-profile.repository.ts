import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IUserProfileRepository } from '../../domains/repositories/i.user-profile.repository';
import type { UserProfileView } from '../../../../shared/users/readers/user-profile.view';

const DEFAULT_DUMMY_PROFILE: UserProfileView = {
  userId: 'anonymous',
  displayName: '기본 더미 유저',
  email: 'dummy-default@example.com',
  avatarUrl: 'https://example.com/avatar/default.png',
};

@Injectable()
export class InMemoryUserProfileRepository implements IUserProfileRepository {
  private readonly profiles: UserProfileView[] = buildDummyProfiles(100);
  private readonly profileMap = new Map<string, UserProfileView>(
    this.profiles.map((p) => [p.userId, p]),
  );

  async getProfileByUserId(userId: string): Promise<UserProfileView> {
    const normalized = userId.trim();
    return this.profileMap.get(normalized) ?? DEFAULT_DUMMY_PROFILE;
  }

  async listProfiles(input: {
    limit: number;
    page: number;
  }): Promise<UserProfileView[]> {
    const limit = Math.min(200, Math.max(1, Number(input.limit ?? 20) || 20));
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const offset = (page - 1) * limit;
    return this.profiles.slice(offset, offset + limit);
  }

  async countProfiles(): Promise<number> {
    return this.profiles.length;
  }
}

function buildDummyProfiles(total: number): UserProfileView[] {
  const safeTotal = Math.min(5000, Math.max(1, Number(total) || 1));
  const list: UserProfileView[] = [];
  for (let i = 1; i <= safeTotal; i += 1) {
    list.push({
      userId: randomUUID(),
      displayName: `더미 유저 ${i}`,
      email: `dummy${i}@example.com`,
      avatarUrl: `https://example.com/avatar/${i}.png`,
    });
  }
  return list;
}
