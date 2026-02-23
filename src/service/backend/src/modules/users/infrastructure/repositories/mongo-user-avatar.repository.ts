import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import {
	type IUserAvatarRepository,
	type UserAvatarDocument,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { optionalEnv } from '@/env';
import { type AvatarDocumentSchema } from '@/modules/users/infrastructure/schemas/avatar.document';
import { AvatarMapper } from '@/modules/users/infrastructure/mappers/avatar.mapper';

@Injectable()
export class MongoUserAvatarRepository
	implements IUserAvatarRepository, OnModuleDestroy
{
	constructor(private readonly avatarMapper: AvatarMapper) {}

	private client: MongoClient | null = null;
	private avatarsCollection: Collection<AvatarDocumentSchema> | null = null;

	private async collection(): Promise<Collection<AvatarDocumentSchema> | null> {
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
			.collection<AvatarDocumentSchema>(collectionName);
		await collection.createIndex({ userId: 1, updatedAt: -1 });

		this.client = client;
		this.avatarsCollection = collection;
		return collection;
	}

	async upsert(input: {
		avatarId: string;
		userId: string;
		imageUrl: string;
	}): Promise<UserAvatarDocument> {
		const collection = await this.collection();
		if (!collection) {
			throw new Error('MONGODB_URL is required to upsert avatar');
		}
		const now = new Date();

		await collection.updateOne(
			{ _id: input.avatarId },
			{
				$set: {
					userId: input.userId,
					imageUrl: input.imageUrl,
					updatedAt: now,
				},
				$setOnInsert: {
					createdAt: now,
				},
			},
			{ upsert: true },
		);

		const found = await collection.findOne({ _id: input.avatarId });
		if (!found) {
			throw new Error('Failed to upsert avatar document');
		}

		return this.avatarMapper.toDocument(found);
	}

	async findByAvatarId(avatarId: string): Promise<UserAvatarDocument | null> {
		const normalized = avatarId.trim();
		if (!normalized) return null;

		const collection = await this.collection();
		if (!collection) return null;
		const found = await collection.findOne({ _id: normalized });
		if (!found) return null;

		return this.avatarMapper.toDocument(found);
	}

	async findByAvatarIds(avatarIds: string[]): Promise<UserAvatarDocument[]> {
		const normalizedIds = [
			...new Set(avatarIds.map((id) => id.trim())),
		].filter((id) => id.length > 0);
		if (normalizedIds.length === 0) return [];

		const collection = await this.collection();
		if (!collection) return [];
		const docs = await collection
			.find({ _id: { $in: normalizedIds } })
			.toArray();

		return docs.map((doc) => this.avatarMapper.toDocument(doc));
	}

	async onModuleDestroy(): Promise<void> {
		if (!this.client) return;
		await this.client.close();
		this.client = null;
		this.avatarsCollection = null;
	}
}
