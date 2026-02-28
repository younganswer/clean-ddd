import { Injectable } from '@nestjs/common';
import { ProcessedEvent } from '@/shared/idempotency/domain/entities/processed-event.entity';
import { ProcessedEventSchema } from '@/shared/idempotency/processed-event.schema';

@Injectable()
export class ProcessedEventMapper {
	toDomain(schema: ProcessedEventSchema): ProcessedEvent {
		return ProcessedEvent.rehydrate({
			uuid: schema.uuid,
			consumerName: schema.consumerName,
			eventId: schema.eventId,
		});
	}

	toSchema(event: ProcessedEvent): ProcessedEventSchema {
		const primitives = event.toPrimitives();

		return new ProcessedEventSchema({
			uuid: primitives.processedEventId,
			consumerName: primitives.consumerName,
			eventId: primitives.eventId,
		});
	}
}
