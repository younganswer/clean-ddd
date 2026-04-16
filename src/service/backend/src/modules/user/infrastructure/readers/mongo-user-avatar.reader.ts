import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { type IUserAvatarReader } from '@/modules/user/domain/readers/i.user-avatar.reader';
import { UserAvatarResult } from '@/modules/user/domain/readers/user-avatar.result';
import { optionalEnv } from '@/shared/env';
import { AvatarDocument } from '@/modules/user/infrastructure/documents/avatar.document';

@Injectable()
export class MongoUserAvatarReader
	implements IUserAvatarReader, OnModuleDestroy
{
	private client: MongoClient | null = null;
	private avatarsCollection: Collection<AvatarDocument> | null = null;

	private async collection(): Promise<Collection<AvatarDocument> | null> {
		if (this.avatarsCollection) return this.avatarsCollection;

		const mongoUrl = optionalEnv('MONGODB_URL');
		if (!mongoUrl) return null;

		const dbName = optionalEnv('MONGODB_DB_NAME') ?? 'clean_ddd';
		const collectionName =
			optionalEnv('MONGODB_AVATAR_COLLECTION') ?? 'avatars';

		const client = new MongoClient(mongoUrl);
		await client.connect();

		const collection = client
			.db(dbName)
			.collection<AvatarDocument>(collectionName);

		this.client = client;
		this.avatarsCollection = collection;
		return collection;
	}

	async findByAvatarId(avatarId: string): Promise<UserAvatarResult | null> {
		const normalized = avatarId.trim();
		if (!normalized) return null;

		const collection = await this.collection();
		if (!collection) return null;
		const found = await collection.findOne({ uuid: normalized });
		if (!found) return null;

		return UserAvatarResult.fromSchema(found);
	}

	async findByAvatarIds(avatarIds: string[]): Promise<UserAvatarResult[]> {
		const normalizedIds = [
			...new Set(avatarIds.map((id) => id.trim())),
		].filter((id) => id.length > 0);
		if (normalizedIds.length === 0) return [];

		const collection = await this.collection();
		if (!collection) return [];
		const docs = await collection
			.find({ uuid: { $in: normalizedIds } })
			.toArray();

		return docs.map((doc) => UserAvatarResult.fromSchema(doc));
	}

	async onModuleDestroy(): Promise<void> {
		if (!this.client) return;
		await this.client.close();
		this.client = null;
		this.avatarsCollection = null;
	}
}
