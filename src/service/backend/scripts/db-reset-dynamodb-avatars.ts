import 'reflect-metadata';

import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	BatchWriteCommand,
	DynamoDBDocumentClient,
	ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import process from 'node:process';

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

const chunk = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
};

const createClients = () => {
	const endpoint = optionalEnv('DYNAMODB_ENDPOINT');
	const region = optionalEnv('AWS_REGION') ?? 'ap-northeast-2';

	const baseClient = new DynamoDBClient({
		region,
		...(endpoint ? { endpoint } : {}),
	});

	const docClient = DynamoDBDocumentClient.from(baseClient, {
		marshallOptions: {
			removeUndefinedValues: true,
		},
	});

	return { baseClient, docClient };
};

const resolveKeyAttributes = async (
	baseClient: DynamoDBClient,
	tableName: string,
): Promise<string[]> => {
	const { Table } = await baseClient.send(
		new DescribeTableCommand({ TableName: tableName }),
	);

	const keySchema = (Table?.KeySchema ?? [])
		.map((key) => key.AttributeName)
		.filter((name): name is string => Boolean(name));

	if (keySchema.length === 0) {
		throw new Error(`Unable to resolve key schema for table: ${tableName}`);
	}

	return keySchema;
};

const scanKeys = async (
	docClient: DynamoDBDocumentClient,
	tableName: string,
	keyAttributes: string[],
): Promise<Record<string, unknown>[]> => {
	const expressionNames = keyAttributes.reduce<Record<string, string>>(
		(acc, name, index) => {
			acc[`#k${index}`] = name;
			return acc;
		},
		{},
	);
	const projection = keyAttributes.map((_, index) => `#k${index}`).join(', ');

	const keys: Record<string, unknown>[] = [];
	let exclusiveStartKey: Record<string, unknown> | undefined;

	do {
		const page = await docClient.send(
			new ScanCommand({
				TableName: tableName,
				ProjectionExpression: projection,
				ExpressionAttributeNames: expressionNames,
				ExclusiveStartKey: exclusiveStartKey,
			}),
		);

		for (const item of page.Items ?? []) {
			const key = keyAttributes.reduce<Record<string, unknown>>(
				(acc, attr) => {
					acc[attr] = item[attr];
					return acc;
				},
				{},
			);
			keys.push(key);
		}

		exclusiveStartKey = page.LastEvaluatedKey as
			| Record<string, unknown>
			| undefined;
	} while (exclusiveStartKey);

	return keys;
};

const batchDelete = async (
	docClient: DynamoDBDocumentClient,
	tableName: string,
	keys: Record<string, unknown>[],
): Promise<number> => {
	let deleted = 0;

	for (const oneBatch of chunk(keys, 25)) {
		let unprocessed: Array<{
			DeleteRequest: { Key: Record<string, unknown> };
		}> = oneBatch.map((key) => ({ DeleteRequest: { Key: key } }));

		while (unprocessed.length > 0) {
			const result = await docClient.send(
				new BatchWriteCommand({
					RequestItems: {
						[tableName]: unprocessed,
					},
				}),
			);

			const retry = (result.UnprocessedItems?.[tableName] ?? []).flatMap(
				(item) => {
					const key = item.DeleteRequest?.Key;
					if (!key) return [];
					return [
						{
							DeleteRequest: {
								Key: key as Record<string, unknown>,
							},
						},
					];
				},
			);
			deleted += unprocessed.length - retry.length;
			unprocessed = retry;
		}
	}

	return deleted;
};

export const runDbResetDynamoDbAvatars = async (): Promise<void> => {
	const tableName = requiredEnv('DYNAMODB_AVATAR_TABLE');
	const { baseClient, docClient } = createClients();

	const keyAttributes = await resolveKeyAttributes(baseClient, tableName);
	const keys = await scanKeys(docClient, tableName, keyAttributes);

	if (keys.length === 0) {
		console.log('db:reset:dynamodb:avatars complete: table already empty');
		return;
	}

	const deleted = await batchDelete(docClient, tableName, keys);
	console.log(
		`db:reset:dynamodb:avatars complete: deleted=${deleted}, scanned=${keys.length}`,
	);
};

if (require.main === module) {
	runDbResetDynamoDbAvatars().catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`db:reset:dynamodb:avatars 실패: ${message}`);
		process.exitCode = 1;
	});
}
