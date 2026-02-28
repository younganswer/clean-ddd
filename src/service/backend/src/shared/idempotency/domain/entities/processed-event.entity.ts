import { randomUUID } from 'node:crypto';
import { BaseEntity } from '@/shared/domain/base.entity';

export class ProcessedEvent extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _consumerName: string,
		private readonly _eventId: string,
	) {
		super(uuid);
	}

	static create(input: {
		consumerName: string;
		eventId: string;
	}): ProcessedEvent {
		const consumerName = String(input.consumerName ?? '').trim();
		const eventId = String(input.eventId ?? '').trim();

		if (!consumerName) throw new Error('consumerName is required');
		if (!eventId) throw new Error('eventId is required');

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
		uuid: string;
		consumerName: string;
		eventId: string;
	} {
		return {
			uuid: this.uuid,
			consumerName: this._consumerName,
			eventId: this._eventId,
		};
	}
}
