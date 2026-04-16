type UserSchema = {
	uuid: string;
	displayName: string;
	email: string;
	avatarId: string | null;
};

type AvatarSchema = {
	imageUrl: string;
};

export class UserProfileResult {
	constructor(
		public readonly userId: string,
		public readonly displayName: string,
		public readonly email: string,
		public readonly avatarId?: string,
		public readonly avatarUrl?: string,
	) {}

	static fromSchema(
		schema: UserSchema,
		avatar?: AvatarSchema | null,
	): UserProfileResult {
		return new UserProfileResult(
			schema.uuid,
			schema.displayName,
			schema.email,
			schema.avatarId ?? undefined,
			avatar?.imageUrl,
		);
	}

	withAvatarUrl(avatarUrl?: string): UserProfileResult {
		return new UserProfileResult(
			this.userId,
			this.displayName,
			this.email,
			this.avatarId,
			avatarUrl,
		);
	}
}
