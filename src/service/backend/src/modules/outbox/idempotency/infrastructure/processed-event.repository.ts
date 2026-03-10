import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';
import type { IProcessedEventRepository } from '@/modules/outbox/idempotency/domain/i.processed-event.repository';
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

	async claim(consumerName: string, eventId: string): Promise<boolean> {
		const normalizedConsumerName = String(consumerName ?? '').trim();
		const normalizedEventId = String(eventId ?? '').trim();

		if (!normalizedConsumerName || !normalizedEventId) {
			return false;
		}

		const em = this.emForContext();
		const now = new Date();
		try {
			await em.insert(ProcessedEventSchema, {
				uuid: randomUUID(),
				createdAt: now,
				updatedAt: now,
				consumerName: normalizedConsumerName,
				eventId: normalizedEventId,
			});
			return true;
		} catch (error: unknown) {
			const maybeError =
				typeof error === 'object' && error !== null
					? (error as Record<string, unknown>)
					: undefined;
			const rawCode = maybeError?.code;
			const rawMessage = maybeError?.message;
			const code =
				typeof rawCode === 'string' || typeof rawCode === 'number'
					? String(rawCode)
					: '';
			const message = typeof rawMessage === 'string' ? rawMessage : '';

			if (
				code === '23505' ||
				message.toLowerCase().includes('unique') ||
				message.toLowerCase().includes('duplicate')
			) {
				return false;
			}

			throw error;
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
