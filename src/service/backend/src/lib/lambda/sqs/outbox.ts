import type { Handler, SQSEvent } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';

let cachedConsumer: OutboxConsumer | undefined;

async function getConsumer(): Promise<OutboxConsumer> {
	if (cachedConsumer) return cachedConsumer;
	const appContext = await NestFactory.createApplicationContext(AppModule, {
		logger: ['log', 'warn', 'error'],
	});
	const consumer = appContext.get(OutboxConsumer, {
		strict: true,
	});
	cachedConsumer = consumer;
	return consumer;
}

export const handler: Handler<SQSEvent, void> = async (event) => {
	const consumer = await getConsumer();
	for (const record of event.Records) {
		await consumer.consumeRawMessage(record);
	}
};
