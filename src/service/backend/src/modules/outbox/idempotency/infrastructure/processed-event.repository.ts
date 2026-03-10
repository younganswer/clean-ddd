import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';
import {
	type IProcessedEventRepository,
	type ProcessedEventFindCriteria,
} from '@/modules/outbox/idempotency/domain/i.processed-event.repository';
import { ProcessedEventMapper } from '@/modules/outbox/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventSchema } from '@/modules/outbox/idempotency/infrastructure/processed-event.schema';

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

	private normalizeFindCriteria(
		criteria: ProcessedEventFindCriteria,
	): Partial<Pick<ProcessedEventSchema, 'consumerName' | 'eventId'>> {
		const normalizedConsumerName = String(
			criteria.consumerName ?? '',
		).trim();
		const normalizedEventId = String(criteria.eventId ?? '').trim();
		const normalizedCriteria: Partial<
			Pick<ProcessedEventSchema, 'consumerName' | 'eventId'>
		> = {};

		if (normalizedConsumerName) {
			normalizedCriteria.consumerName = normalizedConsumerName;
		}
		if (normalizedEventId) {
			normalizedCriteria.eventId = normalizedEventId;
		}

		return normalizedCriteria;
	}

	async findByCriteria(
		criteria: ProcessedEventFindCriteria,
	): Promise<ProcessedEvent[]> {
		const normalizedCriteria = this.normalizeFindCriteria(criteria);

		if (Object.keys(normalizedCriteria).length === 0) {
			return [];
		}

		const em = this.emForContext();
		const found = await em.find(ProcessedEventSchema, normalizedCriteria);

		return found.map((row) => this.mapper.toDomain(row));
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

	async claim(event: ProcessedEvent): Promise<boolean> {
		const em = this.emForContext();
		const now = new Date();
		const schema = this.mapper.toSchema(event);

		const insertedRows = await em
			.getConnection()
			.execute<
				Array<{ uuid: string }>
			>(['insert into "processed_events"', '("uuid", "consumer_name", "event_id", "created_at", "updated_at")', 'values (?, ?, ?, ?, ?)', 'on conflict ("consumer_name", "event_id") do nothing', 'returning "uuid"'].join(' '), [schema.uuid, schema.consumerName, schema.eventId, now, now]);

		return insertedRows.length > 0;
	}

	async release(event: ProcessedEvent): Promise<void> {
		const em = this.emForContext();
		const schema = this.mapper.toSchema(event);
		await em.nativeDelete(ProcessedEventSchema, {
			consumerName: schema.consumerName,
			eventId: schema.eventId,
		});
	}
}
