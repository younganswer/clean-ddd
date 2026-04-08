import { Inject, Injectable } from '@nestjs/common';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import {
	IOutboxQueueSymbol,
	type IOutboxQueue,
} from '@/shared/outbox/domain/queue/i.outbox.queue';
import {
	createRetryAt,
	resolveOutboxMaxAttempts,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';
import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

const OUTBOX_RETRY_DELAY_MS = 60_000;

@Injectable()
export class OutboxSweeper {
	private readonly maxAttempts = resolveOutboxMaxAttempts(
		process.env.OUTBOX_MAX_ATTEMPTS,
	);

	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		@Inject(IOutboxQueueSymbol)
		private readonly outboxQueue: IOutboxQueue,
		private readonly uow: UnitOfWork,
	) {}

	private isDispatchableStatus(status: OutboxEventStatus): boolean {
		return (
			status === OutboxEventStatus.PENDING ||
			status === OutboxEventStatus.FAILED
		);
	}

	async sweepAndEnqueue(limit: number): Promise<number> {
		const now = new Date();
		const candidates = await this.outboxRepository.findDispatchable({
			limit,
			now,
		});
		let enqueued = 0;

		for (const event of candidates) {
			const eventId = event.id;
			if (!eventId) continue;
			if (!this.isDispatchableStatus(event.status)) continue;

			try {
				const payload =
					typeof event.payload === 'object' && event.payload !== null
						? event.payload
						: undefined;
				const orderId = payload?.orderId;
				const messageGroupId =
					typeof orderId === 'string' && orderId ? orderId : 'outbox';

				await this.outboxQueue.enqueue(eventId, {
					messageGroupId,
					source: OutboxDispatchSource.SWEEPER,
				});
				await this.uow.transaction(async () => {
					const outboxEvent =
						await this.outboxRepository.findById(eventId);
					if (!outboxEvent) return;
					if (!this.isDispatchableStatus(outboxEvent.status)) return;

					outboxEvent.markPublished();
					await this.outboxRepository.persist(outboxEvent);
				});
				enqueued += 1;
			} catch (error: unknown) {
				const message = resolveErrorMessage(error);
				await this.uow.transaction(async () => {
					const outboxEvent =
						await this.outboxRepository.findById(eventId);
					if (!outboxEvent) return;

					outboxEvent.recordFailure(
						message,
						createRetryAt(OUTBOX_RETRY_DELAY_MS),
						{ maxAttempts: this.maxAttempts },
					);
					await this.outboxRepository.persist(outboxEvent);
				});
			}
		}

		return enqueued;
	}
}
