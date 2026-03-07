import type { UserAvatarResult } from '@/modules/users/domains/readers/user-avatar.result';

export const IUserAvatarReaderSymbol = Symbol('IUserAvatarReader');

export interface IUserAvatarReader {
	findByAvatarId(avatarId: string): Promise<UserAvatarResult | null>;
	findByAvatarIds(avatarIds: string[]): Promise<UserAvatarResult[]>;
}
