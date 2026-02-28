import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	BatchGetCommand,
	DynamoDBDocumentClient,
	GetCommand,
	UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { type IUserAvatarRepository } from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { optionalEnv } from '@/env';
import { Avatar } from '../../domains/entities/avatar.entity';
import { AvatarMapper } from '../mappers/avatar.mapper';
import { AvatarDocument } from '../documents/avatar.document';

@Injectable()
export class DynamoDbUserAvatarRepository implements IUserAvatarRepository {
	private readonly tableName = optionalEnv('DYNAMODB_AVATAR_TABLE');
	private readonly documentClient: DynamoDBDocumentClient;

	constructor(private readonly avatarMapper: AvatarMapper) {
		const endpoint = optionalEnv('DYNAMODB_ENDPOINT');
		const region = optionalEnv('AWS_REGION') ?? 'ap-northeast-2';

		const baseClient = new DynamoDBClient({
			region,
			...(endpoint ? { endpoint } : {}),
		});

		this.documentClient = DynamoDBDocumentClient.from(baseClient, {
			marshallOptions: {
				removeUndefinedValues: true,
			},
		});
	}

	async upsert(input: {
		avatarId: string;
		userId: string;
		imageUrl: string;
	}): Promise<Avatar> {
		const tableName = this.getTableName();
		const nowIso = new Date().toISOString();
		const normalizedAvatarId = input.avatarId.trim();

		if (!normalizedAvatarId) {
			throw new Error('avatarId is required to upsert avatar');
		}

		await this.documentClient.send(
			new UpdateCommand({
				TableName: tableName,
				Key: { avatarId: normalizedAvatarId },
				UpdateExpression:
					'SET uuid = :uuid, userId = :userId, imageUrl = :imageUrl, updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :createdAt)',
				ExpressionAttributeValues: {
					':uuid': normalizedAvatarId,
					':userId': input.userId,
					':imageUrl': input.imageUrl,
					':updatedAt': nowIso,
					':createdAt': nowIso,
				},
			}),
		);

		const saved = await this.findByAvatarId(normalizedAvatarId);
		if (!saved) {
			throw new Error('Failed to upsert avatar item in DynamoDB');
		}

		return saved;
	}

	async findByAvatarId(avatarId: string): Promise<Avatar | null> {
		const normalized = avatarId.trim();
		if (!normalized) return null;

		const result = await this.documentClient.send(
			new GetCommand({
				TableName: this.getTableName(),
				Key: { avatarId: normalized },
			}),
		);

		if (!result.Item) return null;

		return this.avatarMapper.toDomain(result.Item as AvatarDocument);
	}

	async findByAvatarIds(avatarIds: string[]): Promise<Avatar[]> {
		const normalizedIds = [
			...new Set(avatarIds.map((id) => id.trim())),
		].filter((id) => id.length > 0);

		if (normalizedIds.length === 0) return [];

		const batches = this.chunk(normalizedIds, 100);
		const documents: AvatarDocument[] = [];

		for (const batch of batches) {
			const tableName = this.getTableName();
			const response = await this.documentClient.send(
				new BatchGetCommand({
					RequestItems: {
						[tableName]: {
							Keys: batch.map((avatarId) => ({ avatarId })),
						},
					},
				}),
			);

			const items = response.Responses?.[tableName] as AvatarDocument[];
			if (items && items.length > 0) {
				documents.push(...items);
			}
		}

		return documents.map((document) =>
			this.avatarMapper.toDomain(document),
		);
	}

	private chunk<T>(values: T[], size: number): T[][] {
		const chunks: T[][] = [];
		for (let index = 0; index < values.length; index += size) {
			chunks.push(values.slice(index, index + size));
		}
		return chunks;
	}

	private getTableName(): string {
		if (!this.tableName) {
			throw new Error(
				'Missing required env: DYNAMODB_AVATAR_TABLE (when using DynamoDB avatar repository)',
			);
		}
		return this.tableName;
	}
}
