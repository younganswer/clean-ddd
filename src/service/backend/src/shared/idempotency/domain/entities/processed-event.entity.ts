import { randomUUID } from 'node:crypto';
import { BaseEntity } from '@/shared/domain/base.entity';
import { IDEMPOTENCY_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';

export class ProcessedEvent extends BaseEntity {
	private constructor(
		id: string,
		private readonly _consumerName: string,
		private readonly _eventId: string,
	) {
		super(id);
	}

	static create(input: {
		consumerName: string;
		eventId: string;
	}): ProcessedEvent {
		const consumerName = String(input.consumerName ?? '').trim();
		const eventId = String(input.eventId ?? '').trim();

		if (!consumerName) {
			throw DomainErrorFactory.create(
				IDEMPOTENCY_DOMAIN_ERRORS.IDEMPOTENCY_CONSUMER_NAME_REQUIRED,
			);
		}
		if (!eventId) {
			throw DomainErrorFactory.create(
				IDEMPOTENCY_DOMAIN_ERRORS.IDEMPOTENCY_EVENT_ID_REQUIRED,
			);
		}

		return new ProcessedEvent(randomUUID(), consumerName, eventId);
	}

	static rehydrate(input: {
		uuid: string;
		consumerName: string;
		eventId: string;
	}): ProcessedEvent {
		return new ProcessedEvent(
			input.uuid,
			input.consumerName,
			input.eventId,
		);
	}

	get consumerName(): string {
		return this._consumerName;
	}

	get eventId(): string {
		return this._eventId;
	}

	toPrimitives(): {
		processedEventId: string;
		consumerName: string;
		eventId: string;
	} {
		return {
			processedEventId: this.id,
			consumerName: this._consumerName,
			eventId: this._eventId,
		};
	}
}
