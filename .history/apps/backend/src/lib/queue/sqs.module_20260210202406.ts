import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';
import { requireEnv } from '../../env';

export const SQS_OUTBOX_QUEUE_URL = Symbol('SQS_OUTBOX_QUEUE_URL');
export const SQS_CLIENT = Symbol('SQS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: SQS_OUTBOX_QUEUE_URL,
      useFactory: () => requireEnv('SQS_OUTBOX_QUEUE_URL'),
    },
    {
      provide: SQS_CLIENT,
      useFactory: () => {
        const region = process.env.AWS_REGION;
        const endpoint = process.env.SQS_ENDPOINT;
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
