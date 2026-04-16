import { Avatar } from '@/modules/user/domain/entities/avatar.entity';

export const IUserAvatarRepositorySymbol = Symbol('IUserAvatarRepository');

export interface IUserAvatarRepository {
	upsert(avatar: Avatar): Promise<Avatar>;
	findByAvatarId(avatarId: string): Promise<Avatar | null>;
	findByAvatarIds(avatarIds: string[]): Promise<Avatar[]>;
}
