import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ProcessedEventSchema } from '@/shared/idempotency/processed-event.schema';

@Injectable()
export class IdempotencyService {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async claim(consumerName: string, eventId: string): Promise<boolean> {
		try {
			const em = this.emForContext();
			await em.insert(ProcessedEventSchema, {
				consumerName,
				eventId,
			});
			return true;
		} catch (error: unknown) {
			// unique constraint violation -> already processed
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
		const em = this.emForContext();
		await em.nativeDelete(ProcessedEventSchema, {
			consumerName,
			eventId,
		});
	}
}
