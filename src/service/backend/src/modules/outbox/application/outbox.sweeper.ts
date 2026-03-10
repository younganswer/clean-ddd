import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import {
	IOutboxQueueSymbol,
	type IOutboxQueue,
} from '@/shared/outbox/domain/queue/i.outbox.queue';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import {
	createRetryAt,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';
import { OUTBOX_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';
import { writeStructuredLog } from '@/common/logging/structured-log';

@Injectable()
export class OutboxSweeper {
	constructor(
		private readonly moduleRef: ModuleRef,
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		@Inject(IOutboxQueueSymbol)
		private readonly outboxQueue: IOutboxQueue,
		private readonly uow: UnitOfWork,
	) {}

	private isDirectConsumeFallbackEnabled(): boolean {
		return process.env.OUTBOX_DIRECT_CONSUME_FALLBACK === 'true';
	}

	private async consumeDirect(outboxId: string): Promise<void> {
		const consumer = this.moduleRef.get(OutboxConsumer, { strict: false });
		if (!consumer) {
			throw InfrastructureErrorFactory.create(
				OUTBOX_INFRA_ERRORS.OUTBOX_CONSUMER_PROVIDER_NOT_FOUND,
				{
					details: { outboxId },
				},
			);
		}

		await consumer.consumeRawMessage({
			body: JSON.stringify({
				schemaVersion: 1,
				outboxId,
			}),
		});
	}

	async sweepAndEnqueue(limit: number): Promise<number> {
		const now = new Date();
		const candidates = await this.outboxRepository.findDispatchable({
			limit,
			now,
		});
		let enqueued = 0;
		const directConsumeFallbackEnabled =
			this.isDirectConsumeFallbackEnabled();

		for (const event of candidates) {
			const eventId = event.id;
			if (!eventId) continue;

			if (directConsumeFallbackEnabled) {
				try {
					await this.consumeDirect(eventId);
					enqueued += 1;
					continue;
				} catch (error: unknown) {
					const message = resolveErrorMessage(error);
					writeStructuredLog(
						OutboxSweeper.name,
						{
							step: 'outbox_direct_consume_failed',
							outboxId: eventId,
							error: message,
						},
						'warn',
					);
					await this.uow.transaction(async () => {
						const outboxEvent =
							await this.outboxRepository.findById(eventId);
						if (!outboxEvent) return;

						outboxEvent.recordFailure(
							message,
							createRetryAt(30_000),
						);
						await this.outboxRepository.persist(outboxEvent);
					});
					continue;
				}
			}

			try {
				const payload =
					typeof event.payload === 'object' && event.payload !== null
						? event.payload
						: undefined;
				const orderId = payload?.orderId;
				const messageGroupId =
					typeof orderId === 'string' && orderId ? orderId : 'outbox';

				await this.outboxQueue.enqueue(eventId, { messageGroupId });
				await this.uow.transaction(async () => {
					const outboxEvent =
						await this.outboxRepository.findById(eventId);
					if (!outboxEvent) return;

					outboxEvent.markPublished();
					await this.outboxRepository.persist(outboxEvent);
				});
				enqueued += 1;
			} catch (error: unknown) {
				const message = resolveErrorMessage(error);
				writeStructuredLog(
					OutboxSweeper.name,
					{
						step: 'outbox_sweeper_enqueue_failed',
						outboxId: eventId,
						error: message,
					},
					'warn',
				);
				await this.uow.transaction(async () => {
					const outboxEvent =
						await this.outboxRepository.findById(eventId);
					if (!outboxEvent) return;

					outboxEvent.recordFailure(message, createRetryAt(30_000));
					await this.outboxRepository.persist(outboxEvent);
				});
			}
		}

		return enqueued;
	}
}
