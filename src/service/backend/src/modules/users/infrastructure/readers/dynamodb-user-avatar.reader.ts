import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	BatchGetCommand,
	DynamoDBDocumentClient,
	GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { type IUserAvatarReader } from '@/shared/readers/users/i.user-avatar.reader';
import { UserAvatarResult } from '@/shared/readers/users/user-avatar.result';
import { optionalEnv } from '@/env';
import { USER_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/shared/errors/base.error-factory';

@Injectable()
export class DynamoDbUserAvatarReader implements IUserAvatarReader {
	private readonly tableName = optionalEnv('DYNAMODB_AVATAR_TABLE');
	private readonly documentClient: DynamoDBDocumentClient;

	constructor() {
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

	async findByAvatarId(avatarId: string): Promise<UserAvatarResult | null> {
		const normalized = avatarId.trim();
		if (!normalized) return null;

		const result = await this.documentClient.send(
			new GetCommand({
				TableName: this.getTableName(),
				Key: { avatarId: normalized },
			}),
		);

		if (!result.Item) return null;
		return UserAvatarResult.fromSchema(
			result.Item as {
				uuid: string;
				userId: string;
				imageUrl: string;
			},
		);
	}

	async findByAvatarIds(avatarIds: string[]): Promise<UserAvatarResult[]> {
		const normalizedIds = [
			...new Set(avatarIds.map((id) => id.trim())),
		].filter((id) => id.length > 0);

		if (normalizedIds.length === 0) return [];

		const batches = this.chunk(normalizedIds, 100);
		const items: Array<{
			uuid: string;
			userId: string;
			imageUrl: string;
		}> = [];
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
			const fetched = response.Responses?.[tableName] as Array<{
				uuid: string;
				userId: string;
				imageUrl: string;
			}>;
			if (fetched && fetched.length > 0) {
				items.push(...fetched);
			}
		}

		return items.map((item) => UserAvatarResult.fromSchema(item));
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
			throw InfrastructureErrorFactory.create(
				USER_INFRA_ERRORS.DYNAMODB_AVATAR_TABLE_REQUIRED,
			);
		}
		return this.tableName;
	}
}

export const DynamoDbUserAvatarReaderProvider = {
	provide: DynamoDbUserAvatarReader,
	useClass: DynamoDbUserAvatarReader,
};
