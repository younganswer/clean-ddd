import { Avatar } from '@/modules/users/domains/entities/avatar.entity';

export const IUserAvatarRepositorySymbol = Symbol('IUserAvatarRepository');

export interface IUserAvatarRepository {
	upsert(avatar: Avatar): Promise<Avatar>;
	findByAvatarId(avatarId: string): Promise<Avatar | null>;
	findByAvatarIds(avatarIds: string[]): Promise<Avatar[]>;
}
