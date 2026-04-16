import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	BatchGetCommand,
	DynamoDBDocumentClient,
	GetCommand,
	UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { type IUserAvatarRepository } from '@/modules/user/domains/repositories/i.user-avatar.repository';
import { Avatar } from '@/modules/user/domains/entities/avatar.entity';
import { AvatarDocument } from '@/modules/user/infrastructure/documents/avatar.document';
import { AvatarMapper } from '@/modules/user/infrastructure/mappers/avatar.mapper';
import { optionalEnv } from '@/shared/env';
import {
	UserInfraDynamodbAvatarTableRequiredException,
	UserInfraDynamodbAvatarUpsertFailedException,
} from '@/shared/exceptions';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';

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

	async upsert(avatar: Avatar): Promise<Avatar> {
		const tableName = this.getTableName();
		const nowIso = new Date().toISOString();
		const document = this.avatarMapper.toDocument(avatar);

		await this.documentClient.send(
			new UpdateCommand({
				TableName: tableName,
				Key: { avatarId: document.uuid },
				UpdateExpression:
					'SET uuid = :uuid, userId = :userId, imageUrl = :imageUrl, updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :createdAt)',
				ExpressionAttributeValues: {
					':uuid': document.uuid,
					':userId': document.userId,
					':imageUrl': document.imageUrl,
					':updatedAt': nowIso,
					':createdAt': nowIso,
				},
			}),
		);

		const saved = await this.findByAvatarId(document.uuid);
		if (!saved) {
			throw InfrastructureExceptionFactory.create(
				UserInfraDynamodbAvatarUpsertFailedException,
				{
					cause: { avatarId: document.uuid },
				},
			);
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
			throw InfrastructureExceptionFactory.create(
				UserInfraDynamodbAvatarTableRequiredException,
			);
		}
		return this.tableName;
	}
}
