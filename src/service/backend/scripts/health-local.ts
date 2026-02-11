import { checkPostgresSelect1, getSqsQueueUrl } from './_checks';
import { withRetries } from './_retry';
import { normalizeQueueUrl } from './_url';

const RETRY = { attempts: 3, delayMs: 10_000 };

async function main() {
  const region = process.env.AWS_REGION ?? 'ap-northeast-2';
  const sqsEndpoint = process.env.SQS_ENDPOINT ?? 'http://localhost:45666';
  const queueName = process.env.SQS_QUEUE_NAME ?? 'OutboxDispatchQueue.fifo';

  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://app:app@localhost:54322/clean_ddd';

  await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(databaseUrl);
  });

  const rawQueueUrl = await withRetries(
    { ...RETRY, label: 'SQS(Queue)' },
    async () => getSqsQueueUrl({ endpoint: sqsEndpoint, region, queueName }),
  );
  const queueUrl = normalizeQueueUrl(rawQueueUrl, sqsEndpoint);

  // eslint-disable-next-line no-console
  console.log('헬스체크 성공');
  // eslint-disable-next-line no-console
  console.log(`- Postgres: OK`);
  // eslint-disable-next-line no-console
  console.log(`- SQS Queue: OK (${queueName})`);
  // eslint-disable-next-line no-console
  console.log(`- SQS QueueUrl: ${queueUrl}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`헬스체크 실패 (3회 재시도 후): ${message}`);
  process.exitCode = 1;
});
