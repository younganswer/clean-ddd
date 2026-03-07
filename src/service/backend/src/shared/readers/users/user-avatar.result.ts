type UserAvatarSchema = {
	uuid: string;
	userId: string;
	imageUrl: string;
};

export class UserAvatarResult {
	constructor(
		public readonly avatarId: string,
		public readonly userId: string,
		public readonly imageUrl: string,
	) {}

	static fromSchema(schema: UserAvatarSchema): UserAvatarResult {
		return new UserAvatarResult(
			schema.uuid,
			schema.userId,
			schema.imageUrl,
		);
	}
}
