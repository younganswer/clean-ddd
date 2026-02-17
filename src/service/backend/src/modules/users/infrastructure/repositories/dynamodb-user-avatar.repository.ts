import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  type IUserAvatarRepository,
  type UserAvatarDocument,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { optionalEnv, requireEnv } from '@/env';

type AvatarItem = {
  avatarId: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class DynamoDbUserAvatarRepository implements IUserAvatarRepository {
  private readonly tableName = requireEnv('DYNAMODB_AVATAR_TABLE');
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

  async upsert(input: {
    avatarId: string;
    userId: string;
    imageUrl: string;
  }): Promise<UserAvatarDocument> {
    const nowIso = new Date().toISOString();
    const normalizedAvatarId = input.avatarId.trim();

    if (!normalizedAvatarId) {
      throw new Error('avatarId is required to upsert avatar');
    }

    await this.documentClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { avatarId: normalizedAvatarId },
        UpdateExpression:
          'SET userId = :userId, imageUrl = :imageUrl, updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :createdAt)',
        ExpressionAttributeValues: {
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

  async findByAvatarId(avatarId: string): Promise<UserAvatarDocument | null> {
    const normalized = avatarId.trim();
    if (!normalized) return null;

    const result = await this.documentClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { avatarId: normalized },
      }),
    );

    if (!result.Item) return null;
    return this.toDocument(result.Item as AvatarItem);
  }

  async findByAvatarIds(avatarIds: string[]): Promise<UserAvatarDocument[]> {
    const normalizedIds = [...new Set(avatarIds.map((id) => id.trim()))].filter(
      (id) => id.length > 0,
    );

    if (normalizedIds.length === 0) return [];

    const batches = this.chunk(normalizedIds, 100);
    const items: AvatarItem[] = [];

    for (const batch of batches) {
      const response = await this.documentClient.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch.map((avatarId) => ({ avatarId })),
            },
          },
        }),
      );

      const found = response.Responses?.[this.tableName] as
        | AvatarItem[]
        | undefined;
      if (found && found.length > 0) {
        items.push(...found);
      }
    }

    return items.map((item) => this.toDocument(item));
  }

  private toDocument(item: AvatarItem): UserAvatarDocument {
    return {
      avatarId: item.avatarId,
      userId: item.userId,
      imageUrl: item.imageUrl,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  private chunk<T>(values: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }
    return chunks;
  }
}
