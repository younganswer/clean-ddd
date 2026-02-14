import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';
import { requireEnv } from '../../env';

export const SQS_OUTBOX_QUEUE_URL = Symbol('SQS_OUTBOX_QUEUE_URL');
export const SQS_CLIENT = Symbol('SQS_CLIENT');

function normalizeOutboxQueueUrl(raw: string): string {
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
}

function inferSqsEndpointFromQueueUrl(queueUrl: string): string | undefined {
  try {
    const parsed = new URL(queueUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SQS_OUTBOX_QUEUE_URL,
      useFactory: () =>
        normalizeOutboxQueueUrl(requireEnv('SQS_OUTBOX_QUEUE_URL')),
    },
    {
      provide: SQS_CLIENT,
      useFactory: () => {
        const region = process.env.AWS_REGION;
        const queueUrl = normalizeOutboxQueueUrl(
          process.env.SQS_OUTBOX_QUEUE_URL ?? '',
        );
        const endpoint =
          process.env.SQS_ENDPOINT ??
          (queueUrl ? inferSqsEndpointFromQueueUrl(queueUrl) : undefined);
        return new SQSClient({
          region,
          endpoint,
          ...(endpoint
            ? {
                credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
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
