import type { Handler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import {
	withBoundaryLogging,
	resolveBoundaryErrorMessage,
} from '@/lib/lambda/with-boundary-logging';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxModule } from '@/modules/outbox/outbox.module';
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
	const dispatcher = appContext.select(OutboxModule).get(OutboxDispatcher, {
		strict: true,
	});
	cachedDispatcher = dispatcher;
	return dispatcher;
}

export const handler: Handler = async () => {
	const batchSize = resolveBatchSize();
	const now = new Date();

	await withBoundaryLogging(
		{
			context: 'OutboxDispatchLambda',
			started: {
				step: 'outbox_dispatch_invoked',
				batchSize,
				invokedAt: now.toISOString(),
			},
			completed: (dispatched, _durationMs) => ({
				step: 'outbox_dispatch_completed',
				batchSize,
				dispatched,
				invokedAt: now.toISOString(),
			}),
			failed: (error, _durationMs) => ({
				payload: {
					step: 'outbox_dispatch_failed',
					batchSize,
					invokedAt: now.toISOString(),
					error: resolveBoundaryErrorMessage(error),
				},
			}),
		},
		async () => {
			const dispatcher = await getDispatcher();
			return await dispatcher.dispatchPending(batchSize, now);
		},
	);
};
