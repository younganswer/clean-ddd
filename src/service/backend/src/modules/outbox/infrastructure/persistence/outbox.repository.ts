import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async persist(event: OutboxEvent): Promise<void> {
		const em = this.emForContext();
		const schema = new OutboxEventSchema({
			uuid: event.uuid,
			eventType: event.eventType,
			payload: event.payload,
		});
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

		return OutboxEvent.rehydrate({
			uuid: row.uuid,
			eventType: row.eventType,
			payload: row.payload,
			status: row.status,
			attempt: row.attempt,
			nextAttemptAt: row.nextAttemptAt,
			lockedUntil: row.lockedUntil,
			publishedAt: row.publishedAt,
			lastError: row.lastError,
		});
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

		return rows.map((r) =>
			OutboxEvent.rehydrate({
				uuid: r.uuid,
				eventType: r.eventType,
				payload: r.payload,
				status: r.status,
				attempt: r.attempt,
				nextAttemptAt: r.nextAttemptAt,
				lockedUntil: r.lockedUntil,
				publishedAt: r.publishedAt,
				lastError: r.lastError,
			}),
		);
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
