import type { Handler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { AppModule } from '@/app.module';
import {
	withBoundaryLogging,
	resolveBoundaryErrorMessage,
} from '@/lib/lambda/with-boundary-logging';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { optionalEnv } from '@/env';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';

let cachedDispatcher: OutboxDispatcher | undefined;
let cachedCommandBus: CommandBus | undefined;

type OutboxDispatchInput = {
	outboxId?: string;
	messageGroupId?: string;
	batchSize?: number;
};

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

async function getCommandBus(): Promise<CommandBus> {
	if (cachedCommandBus) return cachedCommandBus;
	const appContext = await NestFactory.createApplicationContext(AppModule, {
		logger: ['log', 'warn', 'error'],
	});
	const commandBus = appContext.get(CommandBus, { strict: false });
	cachedCommandBus = commandBus;
	return commandBus;
}

export const handler: Handler<OutboxDispatchInput | undefined> = async (
	event,
) => {
	const batchSize =
		typeof event?.batchSize === 'number' && event.batchSize > 0
			? event.batchSize
			: resolveBatchSize();
	const now = new Date();
	if (event?.outboxId) {
		const outboxId = event.outboxId;
		const messageGroupId = event.messageGroupId;
		await withBoundaryLogging(
			{
				context: 'OutboxDispatchLambda',
				started: {
					step: 'outbox_dispatch_single_invoked',
					outboxId,
					invokedAt: now.toISOString(),
				},
				completed: () => ({
					step: 'outbox_dispatch_single_completed',
					outboxId,
					invokedAt: now.toISOString(),
				}),
				failed: (error, _durationMs) => ({
					payload: {
						step: 'outbox_dispatch_single_failed',
						outboxId,
						invokedAt: now.toISOString(),
						error: resolveBoundaryErrorMessage(error),
					},
				}),
			},
			async () => {
				const commandBus = await getCommandBus();
				await commandBus.execute(
					new DispatchOutboxEventCommand({
						outboxId,
						messageGroupId,
					}),
				);
			},
		);
		return;
	}

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
