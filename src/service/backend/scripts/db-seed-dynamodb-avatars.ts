import 'reflect-metadata';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { Client } from 'pg';

const databaseUrl = (): string => {
	const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
	if (!url || url.trim().length === 0) {
		throw new Error(
			'DATABASE_URL_DIRECT (or DATABASE_URL) is required (e.g. postgresql://...)',
		);
	}
	return url;
};

const requiredEnv = (name: string): string => {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required env: ${name}`);
	}
	return value;
};

const optionalEnv = (name: string): string | undefined => {
	const value = process.env[name]?.trim();
	return value && value.length > 0 ? value : undefined;
};

const createDocumentClient = (): DynamoDBDocumentClient => {
	const endpoint = optionalEnv('DYNAMODB_ENDPOINT');
	const region = optionalEnv('AWS_REGION') ?? 'ap-northeast-2';

	const baseClient = new DynamoDBClient({
		region,
		...(endpoint ? { endpoint } : {}),
	});

	return DynamoDBDocumentClient.from(baseClient, {
		marshallOptions: {
			removeUndefinedValues: true,
		},
	});
};

const normalizeAvatarId = (avatarId: string | null): string | null => {
	if (!avatarId) return null;
	const normalized = avatarId.trim();
	return normalized.length > 0 ? normalized : null;
};

type UserRow = {
	userId: string;
	avatarId: string | null;
};

export const runDbSeedDynamoDbAvatars = async (): Promise<void> => {
	const tableName = requiredEnv('DYNAMODB_AVATAR_TABLE');
	const url = databaseUrl();
	const nowIso = new Date().toISOString();

	const pgClient = new Client({ connectionString: url });
	await pgClient.connect();

	const users = await pgClient.query<UserRow>(`
    select
      u."uuid" as "userId",
      u."avatar_id" as "avatarId"
    from "users" u
    order by u."id" asc;
  `);

	if (users.rows.length === 0) {
		console.log('dynamodb avatar seed skipped: users table is empty');
		await pgClient.end();
		return;
	}

	const planned = users.rows.map((row, index) => {
		const keptAvatarId = normalizeAvatarId(row.avatarId);
		const avatarId = keptAvatarId ?? randomUUID();

		return {
			userId: row.userId,
			avatarId,
			needsLinkUpdate: !keptAvatarId,
			imageUrl: `https://example.com/avatar/${index + 1}.png`,
		};
	});

	const documentClient = createDocumentClient();

	let upsertedCount = 0;
	for (const item of planned) {
		await documentClient.send(
			new UpdateCommand({
				TableName: tableName,
				Key: { avatarId: item.avatarId },
				UpdateExpression:
					'SET userId = :userId, imageUrl = :imageUrl, updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :createdAt)',
				ExpressionAttributeValues: {
					':userId': item.userId,
					':imageUrl': item.imageUrl,
					':updatedAt': nowIso,
					':createdAt': nowIso,
				},
			}),
		);
		upsertedCount += 1;
	}

	let linkedCount = 0;
	await pgClient.query('begin;');
	try {
		for (const item of planned) {
			if (!item.needsLinkUpdate) continue;

			await pgClient.query(
				`update "users"
         set "avatar_id" = $1,
             "updated_at" = now()
         where "uuid" = $2`,
				[item.avatarId, item.userId],
			);
			linkedCount += 1;
		}

		await pgClient.query('commit;');
	} catch (error) {
		try {
			await pgClient.query('rollback;');
		} catch {
			// ignore
		}
		throw error;
	} finally {
		await pgClient.end();
	}

	console.log(
		`db:seed:dynamodb:avatars complete: users=${users.rows.length}, dynamodb_upserted=${upsertedCount}, postgres_linked=${linkedCount}`,
	);
};

if (require.main === module) {
	runDbSeedDynamoDbAvatars().catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`db:seed:dynamodb:avatars 실패: ${message}`);
		process.exitCode = 1;
	});
}
