import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
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
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';

@Injectable()
export class OutboxConsumer {
	private readonly logger = new Logger(OutboxConsumer.name);
	private readonly consumerName = 'OutboxConsumer';

	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		private readonly idempotencyService: IdempotencyService,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
		private readonly knownHandlerRegistry: OutboxKnownHandlerRegistryService,
	) {}

	private async dispatchKnownEvent(
		event: object,
		eventType: string,
	): Promise<boolean> {
		const registration = this.knownHandlerRegistry.find(eventType);
		if (!registration) return false;
		await registration.handler.handle(event);
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

		this.logger.log(
			JSON.stringify({
				step: 'outbox_consume_received',
				outboxId,
			}),
		);

		const locked = await this.outboxRepository.lock(
			outboxId,
			new Date(Date.now() + 120_000),
		);
		if (!locked) {
			this.logger.log(
				JSON.stringify({
					step: 'outbox_lock_skipped',
					outboxId,
				}),
			);
			return;
		}
		this.logger.log(
			JSON.stringify({
				step: 'outbox_locked',
				outboxId,
			}),
		);

		try {
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) {
					this.logger.warn(
						JSON.stringify({
							step: 'outbox_event_missing',
							outboxId,
						}),
					);
					await this.outboxRepository.unlock(outboxId);
					return;
				}
				if (
					outboxEvent.status !== OutboxEventStatus.PUBLISHED &&
					outboxEvent.status !== OutboxEventStatus.FAILED &&
					outboxEvent.status !== OutboxEventStatus.PENDING
				) {
					this.logger.log(
						JSON.stringify({
							step: 'outbox_status_not_dispatchable',
							outboxId,
							status: outboxEvent.status,
						}),
					);
					await this.outboxRepository.unlock(outboxId);
					return;
				}

				const claimed = await this.idempotencyService.claim(
					this.consumerName,
					outboxId,
				);
				if (!claimed) {
					this.logger.log(
						JSON.stringify({
							step: 'outbox_duplicate_claim',
							outboxId,
							eventType: outboxEvent.eventType,
						}),
					);
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
							JSON.stringify({
								step: 'outbox_unknown_event_type',
								outboxId,
								eventType: outboxEvent.eventType,
							}),
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
					this.logger.log(
						JSON.stringify({
							step: 'outbox_event_dispatched',
							outboxId,
							eventType: outboxEvent.eventType,
							mode: dispatched ? 'known-handler' : 'event-bus',
						}),
					);
					if (!dispatched) {
						this.eventBus.publish(event);
					}
					outboxEvent.markConsumed();
					await this.outboxRepository.persist(outboxEvent);
					this.logger.log(
						JSON.stringify({
							step: 'outbox_marked_consumed',
							outboxId,
							eventType: outboxEvent.eventType,
						}),
					);
				} catch (error: unknown) {
					const message = resolveErrorMessage(error);
					outboxEvent.recordFailure(message, createRetryAt(60_000));
					this.logger.error(
						JSON.stringify({
							step: 'outbox_consume_failed',
							outboxId,
							eventType: outboxEvent.eventType,
							error: message,
						}),
					);
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
				this.logger.log(
					JSON.stringify({
						step: 'outbox_unlocked_after_failure',
						outboxId,
					}),
				);
			} catch {
				// ignore
			}
			throw error;
		}
	}
}
