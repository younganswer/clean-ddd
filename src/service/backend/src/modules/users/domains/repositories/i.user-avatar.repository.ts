import { Avatar } from '../entities/avatar.entity';

export const IUserAvatarRepositorySymbol = Symbol('IUserAvatarRepository');

export interface IUserAvatarRepository {
	upsert(input: {
		avatarId: string;
		userId: string;
		imageUrl: string;
	}): Promise<Avatar>;

	findByAvatarId(avatarId: string): Promise<Avatar | null>;

	findByAvatarIds(avatarIds: string[]): Promise<Avatar[]>;
}
