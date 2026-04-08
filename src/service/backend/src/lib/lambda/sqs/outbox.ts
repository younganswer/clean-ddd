import type { Handler, SQSEvent } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/bootstrap/app.module';
import {
	withBoundaryLogging,
	resolveBoundaryErrorMessage,
} from '@/lib/lambda/with-boundary-logging';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxConsumerModule } from '@/modules/outbox/outbox-consumer.module';

let cachedConsumer: OutboxConsumer | undefined;

async function getConsumer(): Promise<OutboxConsumer> {
	if (cachedConsumer) return cachedConsumer;
	const appContext = await NestFactory.createApplicationContext(AppModule, {
		logger: ['log', 'warn', 'error'],
	});
	const consumer = appContext
		.select(OutboxConsumerModule)
		.get(OutboxConsumer, {
			strict: true,
		});
	cachedConsumer = consumer;
	return consumer;
}

export const handler: Handler<SQSEvent, void> = async (event) => {
	await withBoundaryLogging(
		{
			context: 'OutboxSqsLambda',
			started: {
				step: 'outbox_sqs_lambda_invoked',
				recordCount: event.Records.length,
			},
			completed: (_result, durationMs) => ({
				step: 'outbox_sqs_lambda_completed',
				recordCount: event.Records.length,
				durationMs,
			}),
			failed: (error, durationMs) => ({
				payload: {
					step: 'outbox_sqs_lambda_failed',
					recordCount: event.Records.length,
					durationMs,
					error: resolveBoundaryErrorMessage(error),
				},
			}),
		},
		async () => {
			const consumer = await getConsumer();
			for (const record of event.Records) {
				await consumer.consumeRawMessage(record);
			}
		},
	);
};
