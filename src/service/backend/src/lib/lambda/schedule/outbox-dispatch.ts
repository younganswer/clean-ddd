import type { Handler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { optionalEnv } from '@/env';

let cachedDispatcher: OutboxDispatcher | undefined;

const resolveBatchSize = (): number => {
  const raw = optionalEnv('OUTBOX_DISPATCH_BATCH_SIZE');
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return parsed;
};

async function getDispatcher(): Promise<OutboxDispatcher> {
  if (cachedDispatcher) return cachedDispatcher;
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const dispatcher = appContext.get(OutboxDispatcher, {
    strict: true,
  });
  cachedDispatcher = dispatcher;
  return dispatcher;
}

export const handler: Handler = async () => {
  const dispatcher = await getDispatcher();
  await dispatcher.dispatchPending(resolveBatchSize(), new Date());
};
