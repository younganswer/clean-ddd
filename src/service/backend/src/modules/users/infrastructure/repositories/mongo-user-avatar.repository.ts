import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { type IUserAvatarRepository } from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { optionalEnv } from '@/env';
import { AvatarMapper } from '@/modules/users/infrastructure/mappers/avatar.mapper';
import { AvatarDocument } from '@/modules/users/infrastructure/documents/avatar.document';
import { Avatar } from '../../domains/entities/avatar.entity';

@Injectable()
export class MongoUserAvatarRepository
	implements IUserAvatarRepository, OnModuleDestroy
{
	constructor(private readonly avatarMapper: AvatarMapper) {}

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
		await collection.createIndex({ uuid: 1 }, { unique: true });
		await collection.createIndex({ userId: 1, updatedAt: -1 });

		this.client = client;
		this.avatarsCollection = collection;
		return collection;
	}

	async upsert(input: {
		avatarId: string;
		userId: string;
		imageUrl: string;
	}): Promise<Avatar> {
		const collection = await this.collection();
		if (!collection) {
			throw new Error('MONGODB_URL is required to upsert avatar');
		}
		const avatarId = String(input.avatarId ?? '').trim();
		if (!avatarId) {
			throw new Error('avatarId is required to upsert avatar');
		}

		await collection.updateOne(
			{ uuid: avatarId },
			{
				$set: {
					uuid: avatarId,
					userId: input.userId,
					imageUrl: input.imageUrl,
					updatedAt: new Date(),
				},
				$setOnInsert: {
					createdAt: new Date(),
				},
			},
			{ upsert: true },
		);

		const found = await collection.findOne({ uuid: avatarId });
		if (!found) {
			throw new Error('Failed to upsert avatar document');
		}

		return this.avatarMapper.toDomain(found);
	}

	async findByAvatarId(avatarId: string): Promise<Avatar | null> {
		const normalized = avatarId.trim();
		if (!normalized) return null;

		const collection = await this.collection();
		if (!collection) return null;
		const found = await collection.findOne({ uuid: normalized });
		if (!found) return null;

		return this.avatarMapper.toDomain(found);
	}

	async findByAvatarIds(avatarIds: string[]): Promise<Avatar[]> {
		const normalizedIds = [
			...new Set(avatarIds.map((id) => id.trim())),
		].filter(
			(id) => id.length > 0,
		);
		if (normalizedIds.length === 0) return [];

		const collection = await this.collection();
		if (!collection) return [];
		const docs = await collection
			.find({ uuid: { $in: normalizedIds } })
			.toArray();

		return docs.map((doc) => this.avatarMapper.toDomain(doc));
	}

	async onModuleDestroy(): Promise<void> {
		if (!this.client) return;
		await this.client.close();
		this.client = null;
		this.avatarsCollection = null;
	}
}
