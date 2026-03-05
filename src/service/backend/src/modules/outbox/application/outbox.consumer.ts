import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import type { SQSRecord } from 'aws-lambda';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxEventStatus } from '@/shared/outbox';
import { hydrateEvent } from '@/lib/outbox/event-registry';
import {
	createRetryAt,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';
import { OUTBOX_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/shared/errors/base.error-factory';
import { OUTBOX_KNOWN_EVENT_HANDLER_REGISTRY } from '@/modules/outbox/application/outbox-known-event-handler.registry';

@Injectable()
export class OutboxConsumer {
	private readonly logger = new Logger(OutboxConsumer.name);
	private readonly consumerName = 'OutboxConsumer';

	constructor(
		private readonly moduleRef: ModuleRef,
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		private readonly idempotencyService: IdempotencyService,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	private async dispatchKnownEvent(
		event: object,
		eventType: string,
	): Promise<boolean> {
		const registration = OUTBOX_KNOWN_EVENT_HANDLER_REGISTRY[eventType];
		if (!registration) return false;

		const handler = this.moduleRef.get(registration.token, {
			strict: false,
		});
		if (!handler) {
			throw InfrastructureErrorFactory.create(
				OUTBOX_INFRA_ERRORS.OUTBOX_HANDLER_PROVIDER_NOT_FOUND,
				{
					message: `${registration.handlerName} provider not found`,
					details: {
						eventType,
						handler: registration.handlerName,
					},
				},
			);
		}

		await handler.handle(event);
		return true;
	}

	async consumeRawMessage(record: Pick<SQSRecord, 'body'>): Promise<void> {
		let outboxId: string | undefined;
		try {
			const parsed = JSON.parse(record.body) as { outboxId?: string };
			outboxId = parsed.outboxId;
		} catch {
			this.logger.warn('invalid message body (not json)');
			return;
		}

		if (!outboxId) {
			this.logger.warn('invalid message body (missing outboxId)');
			return;
		}

		const locked = await this.outboxRepository.lock(
			outboxId,
			new Date(Date.now() + 120_000),
		);
		if (!locked) return;

		try {
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) {
					await this.outboxRepository.unlock(outboxId);
					return;
				}
				if (
					outboxEvent.status !== OutboxEventStatus.PUBLISHED &&
					outboxEvent.status !== OutboxEventStatus.FAILED &&
					outboxEvent.status !== OutboxEventStatus.PENDING
				) {
					await this.outboxRepository.unlock(outboxId);
					return;
				}

				const claimed = await this.idempotencyService.claim(
					this.consumerName,
					outboxId,
				);
				if (!claimed) {
					outboxEvent.markConsumed();
					await this.outboxRepository.persist(outboxEvent);
					return;
				}

				try {
					const event = hydrateEvent(
						outboxEvent.eventType,
						outboxEvent.payload,
					);
					if (!event) {
						this.logger.warn(
							`unknown outbox eventType=${outboxEvent.eventType}`,
						);
						outboxEvent.recordFailure(
							`unknown eventType=${outboxEvent.eventType}`,
							createRetryAt(60_000),
						);
						await this.outboxRepository.persist(outboxEvent);
						return;
					}

					const dispatched = await this.dispatchKnownEvent(
						event,
						outboxEvent.eventType,
					);
					if (!dispatched) {
						this.eventBus.publish(event);
					}
					outboxEvent.markConsumed();
					await this.outboxRepository.persist(outboxEvent);
				} catch (error: unknown) {
					const message = resolveErrorMessage(error);
					outboxEvent.recordFailure(message, createRetryAt(60_000));
					try {
						await this.idempotencyService.release(
							this.consumerName,
							outboxId,
						);
					} catch {
						// ignore release failure and keep original error flow
					}
					throw error;
				}
			});
		} catch (error) {
			try {
				await this.uow.transaction(async () => {
					await this.outboxRepository.unlock(outboxId);
				});
			} catch {
				// ignore
			}
			throw error;
		}
	}
}
