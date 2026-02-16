export const IUserAvatarRepositorySymbol = Symbol('IUserAvatarRepository');

export interface UserAvatarDocument {
  avatarId: string;
  userId: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAvatarRepository {
  upsert(input: {
    avatarId: string;
    userId: string;
    imageUrl: string;
  }): Promise<UserAvatarDocument>;

  findByAvatarId(avatarId: string): Promise<UserAvatarDocument | null>;

  findByAvatarIds(avatarIds: string[]): Promise<UserAvatarDocument[]>;
}
