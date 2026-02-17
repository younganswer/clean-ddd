import {
  CreateQueueCommand,
  GetQueueUrlCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';
import { optionalEnv, requireEnv } from '@/env';

export const SQS_OUTBOX_QUEUE_URL = Symbol('SQS_OUTBOX_QUEUE_URL');
export const SQS_CLIENT = Symbol('SQS_CLIENT');

const normalizeOutboxQueueUrl = (raw: string): string => {
  const url = String(raw ?? '').trim();
  if (!url) return url;

  // When running the backend directly on the host machine (not in docker-compose),
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

@Global()
@Module({
  providers: [
    {
      provide: SQS_OUTBOX_QUEUE_URL,
      useFactory: async () => {
        const rawQueueUrl = optionalEnv('SQS_OUTBOX_QUEUE_URL');
        const endpoint = optionalEnv('SQS_ENDPOINT');
        const queueName =
          optionalEnv('SQS_OUTBOX_QUEUE_NAME') ?? 'OutboxDispatchQueue.fifo';

        if (endpoint) {
          const region = process.env.AWS_REGION ?? 'ap-northeast-2';
          const useLocalStaticCreds = isLocalSqsEndpoint(endpoint);
          const client = new SQSClient({
            region,
            endpoint,
            ...(useLocalStaticCreds
              ? {
                  credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
                    secretAccessKey:
                      process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
                    ...(process.env.AWS_SESSION_TOKEN
                      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
                      : {}),
                  },
                }
              : {}),
          });

          try {
            const result = await client.send(
              new GetQueueUrlCommand({
                QueueName: queueName,
              }),
            );

            if (result.QueueUrl && result.QueueUrl.trim().length > 0) {
              return normalizeOutboxQueueUrl(result.QueueUrl);
            }
          } catch {
            if (isLocalSqsEndpoint(endpoint)) {
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
                if (created.QueueUrl && created.QueueUrl.trim().length > 0) {
                  return normalizeOutboxQueueUrl(created.QueueUrl);
                }
              } catch {
                // fallback below
              }
            }

            if (rawQueueUrl) {
              return normalizeOutboxQueueUrl(rawQueueUrl);
            }
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
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
                  ...(process.env.AWS_SESSION_TOKEN
                    ? { sessionToken: process.env.AWS_SESSION_TOKEN }
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
