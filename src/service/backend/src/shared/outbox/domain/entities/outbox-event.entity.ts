import { randomUUID } from 'node:crypto';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { BaseEntity } from '@/common/domain/base.entity';

export class OutboxEvent extends BaseEntity {
	private constructor(
		id: string,
		private readonly _eventType: string,
		private readonly _payload: Record<string, unknown>,
		private readonly _recordedAt: Date,
		private _status: OutboxEventStatus,
		private _attempt: number,
		private _nextAttemptAt: Date,
		private _lockedUntil: Date | null,
		private _publishedAt: Date | null,
		private _lastError: string | null,
	) {
		super(id);
	}

	static create(input: {
		eventType: string;
		payload: Record<string, unknown>;
		recordedAt?: Date;
		status?: OutboxEventStatus;
		attempt?: number;
		nextAttemptAt?: Date;
		lockedUntil?: Date | null;
		publishedAt?: Date | null;
		lastError?: string | null;
	}): OutboxEvent {
		return new OutboxEvent(
			randomUUID(),
			input.eventType,
			input.payload,
			input.recordedAt ?? new Date(),
			input.status ?? OutboxEventStatus.PENDING,
			input.attempt ?? 0,
			input.nextAttemptAt ?? new Date(),
			input.lockedUntil ?? null,
			input.publishedAt ?? null,
			input.lastError ?? null,
		);
	}

	static rehydrate(input: {
		uuid: string;
		eventType: string;
		payload: Record<string, unknown>;
		recordedAt: Date;
		status: OutboxEventStatus;
		attempt: number;
		nextAttemptAt: Date;
		lockedUntil: Date | null;
		publishedAt: Date | null;
		lastError: string | null;
	}): OutboxEvent {
		return new OutboxEvent(
			input.uuid,
			input.eventType,
			input.payload,
			input.recordedAt,
			input.status,
			input.attempt,
			input.nextAttemptAt,
			input.lockedUntil,
			input.publishedAt,
			input.lastError,
		);
	}

	markPublished(now: Date = new Date()): void {
		this._status = OutboxEventStatus.PUBLISHED;
		this._publishedAt = now;
		this._lastError = null;
		this._lockedUntil = null;
	}

	markConsumed(): void {
		this._status = OutboxEventStatus.CONSUMED;
		this._lockedUntil = null;
	}

	recordFailure(error: string, nextAttemptAt: Date): void {
		this._status = OutboxEventStatus.FAILED;
		this._attempt += 1;
		this._lastError = error;
		this._nextAttemptAt = nextAttemptAt;
		this._lockedUntil = null;
	}

	get eventType(): string {
		return this._eventType;
	}

	get payload(): Record<string, unknown> {
		return this._payload;
	}

	get recordedAt(): Date {
		return this._recordedAt;
	}

	get status(): OutboxEventStatus {
		return this._status;
	}

	get attempt(): number {
		return this._attempt;
	}

	get nextAttemptAt(): Date {
		return this._nextAttemptAt;
	}

	get lockedUntil(): Date | null {
		return this._lockedUntil;
	}

	get publishedAt(): Date | null {
		return this._publishedAt;
	}

	get lastError(): string | null {
		return this._lastError;
	}

	toPrimitives(): {
		outboxEventId: string;
		eventType: string;
		payload: Record<string, unknown>;
		recordedAt: Date;
		status: OutboxEventStatus;
		attempt: number;
		nextAttemptAt: Date;
		lockedUntil: Date | null;
		publishedAt: Date | null;
		lastError: string | null;
	} {
		return {
			outboxEventId: this.id,
			eventType: this._eventType,
			payload: this._payload,
			recordedAt: this._recordedAt,
			status: this._status,
			attempt: this._attempt,
			nextAttemptAt: this._nextAttemptAt,
			lockedUntil: this._lockedUntil,
			publishedAt: this._publishedAt,
			lastError: this._lastError,
		};
	}
}
