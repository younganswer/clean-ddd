import { randomUUID } from 'node:crypto';
import { BaseEntity } from '@/common/domain/base.entity';
import {
	IdempotencyConsumerNameRequiredException,
	IdempotencyEventIdRequiredException,
} from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';

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
			throw DomainExceptionFactory.create(
				IdempotencyConsumerNameRequiredException,
			);
		}
		if (!eventId) {
			throw DomainExceptionFactory.create(
				IdempotencyEventIdRequiredException,
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
