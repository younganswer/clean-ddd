import { Inject, Injectable } from '@nestjs/common';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { IOutboxRepositorySymbol } from '@/shared/outbox/domain/i.outbox.repository';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { getEventType, toPayload } from '@/lib/outbox/event-registry';

@Injectable()
export class OutboxProducer {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		private readonly uow: UnitOfWork,
	) {}

	async publish(
		event: object,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<string> {
		return await this.emit(getEventType(event), toPayload(event), options);
	}

	async emit(
		eventType: string,
		payload: Record<string, unknown>,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<string> {
		const delaySeconds = options?.delaySeconds;
		const nextAttemptAt =
			typeof delaySeconds === 'number' && delaySeconds > 0
				? new Date(Date.now() + delaySeconds * 1_000)
				: new Date();

		return await this.uow.transaction(async () => {
			const outboxEvent = OutboxEvent.create({
				eventType,
				payload,
				nextAttemptAt,
			});

			await this.outboxRepository.persist(outboxEvent);

			return outboxEvent.id;
		});
	}
}
