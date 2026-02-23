export const IUserAvatarLinkRepositorySymbol = Symbol(
	'IUserAvatarLinkRepository',
);

export interface IUserAvatarLinkRepository {
	assignAvatarId(input: { userId: string; avatarId: string }): Promise<void>;
}
