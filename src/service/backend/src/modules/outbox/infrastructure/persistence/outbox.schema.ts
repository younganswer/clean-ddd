import { Entity, Index, Property } from '@mikro-orm/core';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { BaseSchema } from '@/common/persistence/mikro-orm/base.schema';

type MandatoryFields = Pick<
	OutboxEventSchema,
	'uuid' | 'eventType' | 'payload'
>;

type OptionalFields = Partial<
	Pick<
		OutboxEventSchema,
		| 'createdAt'
		| 'status'
		| 'attempt'
		| 'nextAttemptAt'
		| 'lockedUntil'
		| 'publishedAt'
		| 'lastError'
	>
>;

@Entity({ tableName: 'outbox_events' })
@Index({ properties: ['status', 'nextAttemptAt'] })
export class OutboxEventSchema extends BaseSchema {
	static readonly DEFAULT_STATUS = OutboxEventStatus.PENDING;
	static readonly DEFAULT_ATTEMPT = 0;

	constructor(input: MandatoryFields & OptionalFields) {
		super(input.uuid);
		this.eventType = input.eventType;
		this.payload = input.payload;
		this.createdAt = input.createdAt ?? this.createdAt;
		this.status = input.status ?? OutboxEventSchema.DEFAULT_STATUS;
		this.attempt = input.attempt ?? OutboxEventSchema.DEFAULT_ATTEMPT;
		this.nextAttemptAt = input.nextAttemptAt ?? this.createdAt;
		this.lockedUntil = input.lockedUntil ?? null;
		this.publishedAt = input.publishedAt ?? null;
		this.lastError = input.lastError ?? null;
	}

	@Property({ type: 'text' })
	eventType!: string;

	@Property({ type: 'json' })
	payload!: Record<string, unknown>;

	@Property({ type: 'string' })
	status: OutboxEventStatus = OutboxEventSchema.DEFAULT_STATUS;

	@Property({ type: 'int' })
	attempt: number = OutboxEventSchema.DEFAULT_ATTEMPT;

	@Property({ type: 'timestamptz' })
	nextAttemptAt: Date = new Date();

	@Property({ type: 'timestamptz', nullable: true })
	lockedUntil: Date | null = null;

	@Property({ type: 'timestamptz', nullable: true })
	publishedAt: Date | null = null;

	@Property({ type: 'text', nullable: true })
	lastError: string | null = null;
}
