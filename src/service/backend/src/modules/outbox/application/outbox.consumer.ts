import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { SQSRecord } from 'aws-lambda';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import { hydrateEvent } from '@/lib/outbox/event-registry';
import { resolveErrorMessage } from '@/modules/outbox/application/outbox-error.util';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { resolveOutboxTimeoutPolicy } from '@/modules/outbox/application/outbox-timeout-policy';

@Injectable()
export class OutboxConsumer {
	private readonly logger = new Logger(OutboxConsumer.name);
	private readonly consumerName = 'OutboxConsumer';
	private static readonly DEFAULT_LOCK_TIMEOUT_MS = 120_000;
	private readonly lockTimeoutMs: number;

	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		private readonly idempotencyService: IdempotencyService,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
		private readonly knownHandlerRegistry: OutboxKnownHandlerRegistryService,
		private readonly consumeStateMachine: OutboxConsumeStateMachine,
	) {
		const timeoutPolicy = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: process.env.OUTBOX_CONSUMER_LOCK_TIMEOUT_MS,
			visibilityTimeoutSecondsRaw:
				process.env.OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS,
			defaultLockTimeoutMs: OutboxConsumer.DEFAULT_LOCK_TIMEOUT_MS,
			defaultVisibilityTimeoutSeconds: Math.floor(
				OutboxConsumer.DEFAULT_LOCK_TIMEOUT_MS / 1000,
			),
			logger: this.logger,
		});

		this.lockTimeoutMs = timeoutPolicy.lockTimeoutMs;
	}

	private async dispatchKnownEvent(
		event: object,
		eventType: string,
	): Promise<boolean> {
		const registration = this.knownHandlerRegistry.find(eventType);
		if (!registration) return false;
		await registration.handler.handle(event);
		return true;
	}

	private parseOutboxId(record: Pick<SQSRecord, 'body'>): string | null {
		try {
			const parsed = JSON.parse(record.body) as { outboxId?: string };
			if (!parsed.outboxId) {
				this.logger.warn('invalid message body (missing outboxId)');
				return null;
			}
			return parsed.outboxId;
		} catch {
			this.logger.warn('invalid message body (not json)');
			return null;
		}
	}

	private async tryLockOutbox(outboxId: string): Promise<boolean> {
		const locked = await this.outboxRepository.lock(
			outboxId,
			new Date(Date.now() + this.lockTimeoutMs),
		);
		if (!locked) {
			this.logger.log(
				JSON.stringify({
					step: 'outbox_lock_skipped',
					outboxId,
				}),
			);
			return false;
		}

		this.logger.log(
			JSON.stringify({
				step: 'outbox_locked',
				outboxId,
			}),
		);
		return true;
	}

	private async unlockWithTransaction(outboxId: string): Promise<void> {
		await this.uow.transaction(
			async () => {
				await this.outboxRepository.unlock(outboxId);
			},
			{ requiresNew: true },
		);
	}

	private async recoverFailureWithTransaction(
		outboxId: string,
		error: unknown,
	): Promise<void> {
		const message = resolveErrorMessage(error);

		await this.uow.transaction(
			async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) {
					this.logger.warn(
						JSON.stringify({
							step: 'outbox_event_missing_during_failure_recovery',
							outboxId,
						}),
					);
					await this.outboxRepository.unlock(outboxId);
					return;
				}

				this.consumeStateMachine.markDispatchFailure(
					outboxEvent,
					message,
				);
				await this.outboxRepository.persist(outboxEvent);
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
				} catch (releaseError: unknown) {
					this.logger.error(
						JSON.stringify({
							step: 'outbox_idempotency_release_failed',
							outboxId,
							eventType: outboxEvent.eventType,
							error: resolveErrorMessage(releaseError),
						}),
					);
				}
			},
			{ requiresNew: true },
		);
	}

	private async consumeLockedOutboxWithTransaction(
		outboxId: string,
	): Promise<void> {
		await this.uow.transaction(async () => {
			const outboxEvent = await this.outboxRepository.findById(outboxId);
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

			if (!this.consumeStateMachine.isDispatchable(outboxEvent)) {
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
				this.consumeStateMachine.markDuplicateClaimConflict(
					outboxEvent,
				);
				await this.outboxRepository.persist(outboxEvent);
				await this.outboxRepository.unlock(outboxId);
				return;
			}

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
				this.consumeStateMachine.markUnknownEventTypeFailure(
					outboxEvent,
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
			this.consumeStateMachine.markConsumed(outboxEvent);
			await this.outboxRepository.persist(outboxEvent);
			this.logger.log(
				JSON.stringify({
					step: 'outbox_marked_consumed',
					outboxId,
					eventType: outboxEvent.eventType,
				}),
			);
		});
	}

	async consumeRawMessage(record: Pick<SQSRecord, 'body'>): Promise<void> {
		const outboxId = this.parseOutboxId(record);
		if (!outboxId) {
			return;
		}

		this.logger.log(
			JSON.stringify({
				step: 'outbox_consume_received',
				outboxId,
			}),
		);

		const locked = await this.tryLockOutbox(outboxId);
		if (!locked) {
			return;
		}

		try {
			await this.consumeLockedOutboxWithTransaction(outboxId);
		} catch (error) {
			try {
				await this.recoverFailureWithTransaction(outboxId, error);
				this.logger.log(
					JSON.stringify({
						step: 'outbox_unlocked_after_failure',
						outboxId,
					}),
				);
			} catch (recoveryError: unknown) {
				this.logger.error(
					JSON.stringify({
						step: 'outbox_failure_recovery_failed',
						outboxId,
						error: resolveErrorMessage(recoveryError),
					}),
				);
				try {
					await this.unlockWithTransaction(outboxId);
				} catch {
					// ignore
				}
			}
			throw error;
		}
	}
}
