import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import { MikroORM } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

export type SqsCheckInput = {
  endpoint: string;
  region: string;
  queueName: string;
};

export async function checkPostgresSelect1(databaseUrl: string): Promise<void> {
  const orm = await MikroORM.init<PostgreSqlDriver>(
    defineConfig({
      clientUrl: databaseUrl,
      allowGlobalContext: false,
      // 헬스체크용이라 엔티티 스캔은 불필요합니다.
      entities: [],
      entitiesTs: [],
      pool: {
        min: 0,
        max: 1,
      },
    }),
  );

  try {
    await orm.em.getConnection().execute('select 1 as ok');
  } finally {
    await orm.close(true);
  }
}

export async function getSqsQueueUrl(input: SqsCheckInput): Promise<string> {
  const { endpoint, region, queueName } = input;

  const client = new SQSClient({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    },
  });

  const result = await client.send(
    new GetQueueUrlCommand({
      QueueName: queueName,
    }),
  );

  const queueUrl = result.QueueUrl;
  if (!queueUrl) {
    throw new Error('SQS GetQueueUrl returned empty QueueUrl');
  }

  return queueUrl;
}
