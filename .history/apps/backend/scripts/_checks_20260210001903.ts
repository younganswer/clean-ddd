import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import pg = require('pg');

export type SqsCheckInput = {
  endpoint: string;
  region: string;
  queueName: string;
};

export async function checkPostgresSelect1(databaseUrl: string): Promise<void> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
    query_timeout: 5_000,
  });

  await client.connect();
  try {
    await client.query('select 1 as ok');
  } finally {
    await client.end();
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
