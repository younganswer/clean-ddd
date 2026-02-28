import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OutboxMapper } from '../mappers/outbox.mapper';

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

	async findById(uuid: string): Promise<OutboxEvent | null> {
		const em = this.emForContext();
		const row = await em.findOne(OutboxEventSchema, { uuid });
		if (!row) return null;

		return this.mapper.toDomain(row);
	}

	async findDispatchable(limit: number, now: Date): Promise<OutboxEvent[]> {
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
				orderBy: { id: 'asc' },
			},
		);

		return rows.map((r) => this.mapper.toDomain(r));
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
