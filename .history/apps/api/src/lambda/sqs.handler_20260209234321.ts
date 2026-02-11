import type { Handler, SQSEvent } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OutboxConsumer } from '../shared/outbox/outbox.consumer';

let cachedConsumer: OutboxConsumer | undefined;

async function getConsumer(): Promise<OutboxConsumer> {
  if (cachedConsumer) return cachedConsumer;
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  cachedConsumer = appContext.get(OutboxConsumer, { strict: true });
  return cachedConsumer;
}

export const handler: Handler<SQSEvent, void> = async (event) => {
  const consumer = await getConsumer();
  for (const record of event.Records) {
    await consumer.consumeRawMessage(record);
  }
};
