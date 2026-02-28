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
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import {
	PaymentWebhookFailedHandler,
	PaymentWebhookSucceededHandler,
} from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';

@Injectable()
export class OutboxConsumer {
	private readonly logger = new Logger(OutboxConsumer.name);
	private readonly consumerName = 'OutboxConsumer';

	constructor(
		private readonly moduleRef: ModuleRef,
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepo: IOutboxRepository,
		private readonly idempotency: IdempotencyService,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	private async dispatchKnownEvent(
		event: object,
		eventType: string,
	): Promise<boolean> {
		if (eventType === PaymentWebhookSucceededEvent.eventType) {
			const handler = this.moduleRef.get(PaymentWebhookSucceededHandler, {
				strict: false,
			});
			if (!handler) {
				throw new Error(
					'PaymentWebhookSucceededHandler provider not found',
				);
			}
			await handler.handle(event as PaymentWebhookSucceededEvent);
			return true;
		}

		if (eventType === PaymentWebhookFailedEvent.eventType) {
			const handler = this.moduleRef.get(PaymentWebhookFailedHandler, {
				strict: false,
			});
			if (!handler) {
				throw new Error(
					'PaymentWebhookFailedHandler provider not found',
				);
			}
			await handler.handle(event as PaymentWebhookFailedEvent);
			return true;
		}

		if (eventType === ReserveInventoryForOrderRequestedEvent.eventType) {
			const handler = this.moduleRef.get(
				ReserveInventoryForOrderRequestedHandler,
				{
					strict: false,
				},
			);
			if (!handler) {
				throw new Error(
					'ReserveInventoryForOrderRequestedHandler provider not found',
				);
			}
			await handler.handle(
				event as ReserveInventoryForOrderRequestedEvent,
			);
			return true;
		}

		if (eventType === CreateShipmentForOrderRequestedEvent.eventType) {
			const handler = this.moduleRef.get(
				CreateShipmentForOrderRequestedHandler,
				{
					strict: false,
				},
			);
			if (!handler) {
				throw new Error(
					'CreateShipmentForOrderRequestedHandler provider not found',
				);
			}
			await handler.handle(event as CreateShipmentForOrderRequestedEvent);
			return true;
		}

		return false;
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

		const locked = await this.outboxRepo.lock(
			outboxId,
			new Date(Date.now() + 120_000),
		);
		if (!locked) return;

		try {
			await this.uow.transaction(async () => {
				const outboxEvent = await this.outboxRepo.findById(outboxId);
				if (!outboxEvent) {
					await this.outboxRepo.unlock(outboxId);
					return;
				}
				if (
					outboxEvent.status !== OutboxEventStatus.PUBLISHED &&
					outboxEvent.status !== OutboxEventStatus.FAILED &&
					outboxEvent.status !== OutboxEventStatus.PENDING
				) {
					await this.outboxRepo.unlock(outboxId);
					return;
				}

				const claimed = await this.idempotency.claim(
					this.consumerName,
					outboxId,
				);
				if (!claimed) {
					outboxEvent.markConsumed();
					await this.outboxRepo.persist(outboxEvent);
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
						await this.outboxRepo.persist(outboxEvent);
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
					await this.outboxRepo.persist(outboxEvent);
				} catch (error: unknown) {
					const message = resolveErrorMessage(error);
					outboxEvent.recordFailure(message, createRetryAt(60_000));
					try {
						await this.idempotency.release(
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
					await this.outboxRepo.unlock(outboxId);
				});
			} catch {
				// ignore
			}
			throw error;
		}
	}
}
