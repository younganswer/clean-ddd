import type { UserProfileView } from '../../../../shared/users/readers/user-profile.view';

export const IUserProfileRepositorySymbol = Symbol('IUserProfileRepository');

export interface IUserProfileRepository {
  getProfileByUserId(userId: string): Promise<UserProfileView>;

  listProfiles(input: {
    limit: number;
    page: number;
  }): Promise<UserProfileView[]>;

  countProfiles(): Promise<number>;
}
