import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import type {
	IOutboxRepository,
	OutboxConsumedOrderingCriteria,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { OutboxMapper } from '@/modules/outbox/infrastructure/mappers/outbox.mapper';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OUTBOX_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: OutboxMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async persist(event: OutboxEvent): Promise<void> {
		const em = this.emForContext();
		const schema = this.mapper.toSchema(event);
		const exists = await em.findOne(OutboxEventSchema, {
			uuid: schema.uuid,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(OutboxEventSchema, schema);
		}
	}

	async getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OutboxEvent> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() =>
				InfrastructureErrorFactory.create(
					OUTBOX_INFRA_ERRORS.OUTBOX_EVENT_NOT_FOUND,
					{ details: { outboxId: id } },
				));
		const row = await em.findOneOrFail(
			OutboxEventSchema,
			{ uuid: id },
			{ failHandler },
		);

		return this.mapper.toDomain(row);
	}

	async findById(id: string): Promise<OutboxEvent | null> {
		const em = this.emForContext();
		const row = await em.findOne(OutboxEventSchema, { uuid: id });
		return row ? this.mapper.toDomain(row) : null;
	}

	async findDispatchable(
		options: RepositoryPageOptions<OutboxEvent> & { now: Date },
	): Promise<OutboxEvent[]> {
		const { limit, offset = 0, now } = options;
		const em = this.emForContext();
		const rows = await em.find(
			OutboxEventSchema,
			{
				status: {
					$in: [OutboxEventStatus.PENDING, OutboxEventStatus.FAILED],
				},
				nextAttemptAt: { $lte: now },
				$or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
			},
			{
				limit,
				offset,
				orderBy: { id: 'asc' },
			},
		);

		return rows.map((r) => this.mapper.toDomain(r));
	}

	async findRecent(
		options: RepositoryPageOptions<OutboxEvent>,
	): Promise<OutboxEvent[]> {
		const { limit, offset = 0 } = options;
		const em = this.emForContext();
		const rows = await em.find(
			OutboxEventSchema,
			{},
			{
				limit,
				offset,
				orderBy: { id: 'desc' },
			},
		);

		return rows.map((row) => this.mapper.toDomain(row));
	}

	async hasConsumedNewerEvent(
		criteria: OutboxConsumedOrderingCriteria,
	): Promise<boolean> {
		const em = this.emForContext();
		const rows = await em
			.getConnection()
			.execute<
				Array<{ found: number }>
			>(['select 1 as found', 'from "outbox_events"', 'where "event_type" = ?', 'and "status" = ?', "and coalesce(\"payload\"->>'aggregateId', '') = ?", 'and (', "(case when (\"payload\"->>'eventVersion') ~ '^[0-9]+$' then (\"payload\"->>'eventVersion')::bigint else 1 end) > ?", 'or (', "(case when (\"payload\"->>'eventVersion') ~ '^[0-9]+$' then (\"payload\"->>'eventVersion')::bigint else 1 end) = ?", "and (case when (\"payload\"->>'sequence') ~ '^[0-9]+$' then (\"payload\"->>'sequence')::bigint else 0 end) > ?", ')', ')', 'limit 1'].join(' '), [criteria.eventType, OutboxEventStatus.CONSUMED, criteria.aggregateId, criteria.eventVersion, criteria.eventVersion, criteria.sequence]);

		return rows.length > 0;
	}

	async lock(uuid: string, lockedUntil: Date): Promise<boolean> {
		const em = this.emForContext();
		const now = new Date();
		const updated = await em.nativeUpdate(
			OutboxEventSchema,
			{
				uuid,
				$or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
			},
			{
				lockedUntil,
			},
		);
		return updated === 1;
	}

	async unlock(uuid: string): Promise<void> {
		const em = this.emForContext();
		await em.nativeUpdate(
			OutboxEventSchema,
			{ uuid },
			{ lockedUntil: null },
		);
	}
}
