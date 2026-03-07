import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ProcessedEvent } from '@/shared/idempotency/domain/entities/processed-event.entity';
import type { IProcessedEventRepository } from '@/shared/idempotency/domain/i.processed-event.repository';
import { ProcessedEventMapper } from '@/shared/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventSchema } from '@/shared/idempotency/processed-event.schema';

@Injectable()
export class ProcessedEventRepository implements IProcessedEventRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: ProcessedEventMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async find(
		consumerName: string,
		eventId: string,
	): Promise<ProcessedEvent | null> {
		const normalizedConsumerName = String(consumerName ?? '').trim();
		const normalizedEventId = String(eventId ?? '').trim();

		if (!normalizedConsumerName || !normalizedEventId) {
			return null;
		}

		const em = this.emForContext();
		const found = await em.findOne(ProcessedEventSchema, {
			consumerName: normalizedConsumerName,
			eventId: normalizedEventId,
		});

		return found ? this.mapper.toDomain(found) : null;
	}

	async persist(event: ProcessedEvent): Promise<void> {
		const em = this.emForContext();
		const schema = this.mapper.toSchema(event);
		const exists = await em.findOne(ProcessedEventSchema, {
			consumerName: schema.consumerName,
			eventId: schema.eventId,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(ProcessedEventSchema, schema);
		}
	}

	async release(consumerName: string, eventId: string): Promise<void> {
		const normalizedConsumerName = String(consumerName ?? '').trim();
		const normalizedEventId = String(eventId ?? '').trim();

		if (!normalizedConsumerName || !normalizedEventId) {
			return;
		}

		const em = this.emForContext();
		await em.nativeDelete(ProcessedEventSchema, {
			consumerName: normalizedConsumerName,
			eventId: normalizedEventId,
		});
	}
}
