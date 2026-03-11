import { Injectable } from '@nestjs/common';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';

@Injectable()
export class OutboxMapper {
	toDomain(schema: OutboxEventSchema): OutboxEvent {
		return OutboxEvent.rehydrate({
			uuid: schema.uuid,
			eventType: schema.eventType,
			payload: schema.payload,
			status: schema.status,
			attempt: schema.attempt,
			recordedAt: schema.createdAt,
			nextAttemptAt: schema.nextAttemptAt,
			lockedUntil: schema.lockedUntil,
			publishedAt: schema.publishedAt,
			lastError: schema.lastError,
		});
	}

	toSchema(event: OutboxEvent): OutboxEventSchema {
		const primitives = event.toPrimitives();
		const schema = new OutboxEventSchema({
			uuid: primitives.outboxEventId,
			eventType: primitives.eventType,
			payload: primitives.payload,
		});

		schema.createdAt = primitives.recordedAt;
		schema.status = primitives.status;
		schema.attempt = primitives.attempt;
		schema.nextAttemptAt = primitives.nextAttemptAt;
		schema.lockedUntil = primitives.lockedUntil;
		schema.publishedAt = primitives.publishedAt;
		schema.lastError = primitives.lastError;

		return schema;
	}
}
