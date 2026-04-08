import {
	CreateQueueCommand,
	GetQueueUrlCommand,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';
import { optionalEnv, requireEnv } from '@/shared/env';

export const SQS_OUTBOX_QUEUE_URL = Symbol('SQS_OUTBOX_QUEUE_URL');
export const SQS_CLIENT = Symbol('SQS_CLIENT');

const normalizeOutboxQueueUrl = (raw: string): string => {
	const url = String(raw ?? '').trim();
	if (!url) return url;

	// When running the backend on the host machine (not in docker-compose),
	// the hostname `localstack` is typically not resolvable. In that case, rewrite
	// it to `localhost` which is how localstack is usually exposed.
	try {
		const parsed = new URL(url);
		if (parsed.hostname === 'localstack' && !process.env.SQS_ENDPOINT) {
			parsed.hostname = 'localhost';
			return parsed.toString();
		}
	} catch {
		// ignore
	}
	return url;
};

const isLocalSqsEndpoint = (endpoint: string): boolean => {
	try {
		const parsed = new URL(endpoint);
		return (
			parsed.hostname === 'localhost' ||
			parsed.hostname === '127.0.0.1' ||
			parsed.hostname === 'localstack'
		);
	} catch {
		return false;
	}
};

const resolveLocalSqsCredentials = (): {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
} => ({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
	...(process.env.AWS_SESSION_TOKEN
		? {
				sessionToken: process.env.AWS_SESSION_TOKEN,
			}
		: {}),
});

const createLookupClient = (endpoint: string): SQSClient => {
	const region = process.env.AWS_REGION ?? 'ap-northeast-2';
	const useLocalStaticCreds = isLocalSqsEndpoint(endpoint);
	return new SQSClient({
		region,
		endpoint,
		...(useLocalStaticCreds
			? {
					credentials: resolveLocalSqsCredentials(),
				}
			: {}),
	});
};

const toNormalizedQueueUrlIfPresent = (
	queueUrl: string | undefined,
): string | null => {
	if (!queueUrl || queueUrl.trim().length === 0) {
		return null;
	}

	return normalizeOutboxQueueUrl(queueUrl);
};

const tryGetQueueUrl = async (
	client: SQSClient,
	queueName: string,
): Promise<string | null> => {
	try {
		const result = await client.send(
			new GetQueueUrlCommand({
				QueueName: queueName,
			}),
		);

		return toNormalizedQueueUrlIfPresent(result.QueueUrl);
	} catch {
		return null;
	}
};

const tryCreateQueueAndGetQueueUrl = async (
	client: SQSClient,
	queueName: string,
): Promise<string | null> => {
	try {
		await client.send(
			new CreateQueueCommand({
				QueueName: queueName,
				Attributes: queueName.endsWith('.fifo')
					? {
							FifoQueue: 'true',
							ContentBasedDeduplication: 'false',
						}
					: undefined,
			}),
		);

		const created = await client.send(
			new GetQueueUrlCommand({
				QueueName: queueName,
			}),
		);

		return toNormalizedQueueUrlIfPresent(created.QueueUrl);
	} catch {
		return null;
	}
};

const resolveQueueUrlFromEndpoint = async (params: {
	endpoint: string;
	queueName: string;
	rawQueueUrl?: string;
}): Promise<string | null> => {
	const client = createLookupClient(params.endpoint);
	const resolved = await tryGetQueueUrl(client, params.queueName);
	if (resolved) {
		return resolved;
	}

	if (isLocalSqsEndpoint(params.endpoint)) {
		const created = await tryCreateQueueAndGetQueueUrl(
			client,
			params.queueName,
		);
		if (created) {
			return created;
		}
	}

	if (params.rawQueueUrl) {
		return normalizeOutboxQueueUrl(params.rawQueueUrl);
	}

	return null;
};

@Global()
@Module({
	providers: [
		{
			provide: SQS_OUTBOX_QUEUE_URL,
			useFactory: async () => {
				const rawQueueUrl = optionalEnv('SQS_OUTBOX_QUEUE_URL');
				const endpoint = optionalEnv('SQS_ENDPOINT');
				const queueName =
					optionalEnv('SQS_OUTBOX_QUEUE_NAME') ??
					'OutboxDispatchQueue.fifo';

				if (endpoint) {
					const resolved = await resolveQueueUrlFromEndpoint({
						endpoint,
						queueName,
						rawQueueUrl,
					});
					if (resolved) {
						return resolved;
					}
				}

				return normalizeOutboxQueueUrl(
					rawQueueUrl ?? requireEnv('SQS_OUTBOX_QUEUE_URL'),
				);
			},
		},
		{
			provide: SQS_CLIENT,
			useFactory: () => {
				const region = process.env.AWS_REGION;
				const endpoint = process.env.SQS_ENDPOINT;
				const useLocalStaticCreds =
					endpoint !== undefined && isLocalSqsEndpoint(endpoint);
				return new SQSClient({
					region,
					...(endpoint ? { endpoint } : {}),
					...(useLocalStaticCreds
						? {
								credentials: {
									accessKeyId:
										process.env.AWS_ACCESS_KEY_ID ?? 'test',
									secretAccessKey:
										process.env.AWS_SECRET_ACCESS_KEY ??
										'test',
									...(process.env.AWS_SESSION_TOKEN
										? {
												sessionToken:
													process.env
														.AWS_SESSION_TOKEN,
											}
										: {}),
								},
							}
						: {}),
				});
			},
		},
	],
	exports: [SQS_OUTBOX_QUEUE_URL, SQS_CLIENT],
})
export class SqsModule {}
