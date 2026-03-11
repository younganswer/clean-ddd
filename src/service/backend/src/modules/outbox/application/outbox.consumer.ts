import { Inject, Injectable } from '@nestjs/common';
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
import { writeStructuredLog } from '@/common/logging/structured-log';
import {
	parseOutboxDispatchMessage,
	type NormalizedOutboxDispatchMessage,
} from '@/shared/outbox/domain/queue/outbox-dispatch-message';

@Injectable()
export class OutboxConsumer {
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
			loggerContext: OutboxConsumer.name,
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

	private parseOutboxMessage(
		record: Pick<SQSRecord, 'body'>,
	): NormalizedOutboxDispatchMessage | null {
		const parsed = parseOutboxDispatchMessage(record.body);

		if (!parsed.ok) {
			if (parsed.reason === 'missing-outbox-id') {
				writeStructuredLog(
					OutboxConsumer.name,
					{ step: 'outbox_message_body_missing_outbox_id' },
					'warn',
				);
				return null;
			}

			writeStructuredLog(
				OutboxConsumer.name,
				{ step: 'outbox_message_body_invalid_json' },
				'warn',
			);
			return null;
		}

		return parsed.message;
	}

	private async tryLockOutbox(
		outboxId: string,
		source: NormalizedOutboxDispatchMessage['source'],
	): Promise<boolean> {
		const startedAt = Date.now();
		const locked = await this.outboxRepository.lock(
			outboxId,
			new Date(Date.now() + this.lockTimeoutMs),
		);
		if (!locked) {
			writeStructuredLog(OutboxConsumer.name, {
				step: 'outbox_lock_skipped',
				outboxId,
				source,
			});
			return false;
		}

		writeStructuredLog(OutboxConsumer.name, {
			step: 'outbox_locked',
			outboxId,
			source,
			lockMs: Date.now() - startedAt,
		});
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
		source: NormalizedOutboxDispatchMessage['source'],
		error: unknown,
	): Promise<void> {
		const message = resolveErrorMessage(error);

		await this.uow.transaction(
			async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) {
					writeStructuredLog(
						OutboxConsumer.name,
						{
							step: 'outbox_event_missing_during_failure_recovery',
							outboxId,
							source,
						},
						'warn',
					);
					await this.outboxRepository.unlock(outboxId);
					return;
				}

				this.consumeStateMachine.markDispatchFailure(
					outboxEvent,
					message,
				);
				await this.outboxRepository.persist(outboxEvent);
				writeStructuredLog(
					OutboxConsumer.name,
					{
						step: 'outbox_consume_failed',
						outboxId,
						source,
						eventType: outboxEvent.eventType,
						error: message,
					},
					'error',
				);

				try {
					await this.idempotencyService.release(
						this.consumerName,
						outboxId,
					);
				} catch (releaseError: unknown) {
					writeStructuredLog(
						OutboxConsumer.name,
						{
							step: 'outbox_idempotency_release_failed',
							outboxId,
							source,
							eventType: outboxEvent.eventType,
							error: resolveErrorMessage(releaseError),
						},
						'error',
					);
				}
			},
			{ requiresNew: true },
		);
	}

	private async consumeLockedOutboxWithTransaction(
		outboxId: string,
		source: NormalizedOutboxDispatchMessage['source'],
	): Promise<void> {
		const consumeStartedAt = Date.now();
		await this.uow.transaction(async () => {
			const loadStartedAt = Date.now();
			const outboxEvent = await this.outboxRepository.findById(outboxId);
			const loadOutboxMs = Date.now() - loadStartedAt;
			if (!outboxEvent) {
				writeStructuredLog(
					OutboxConsumer.name,
					{
						step: 'outbox_event_missing',
						outboxId,
						source,
					},
					'warn',
				);
				await this.outboxRepository.unlock(outboxId);
				return;
			}

			const eventAgeMs =
				consumeStartedAt - outboxEvent.recordedAt.getTime();
			const publishedLagMs = outboxEvent.publishedAt
				? consumeStartedAt - outboxEvent.publishedAt.getTime()
				: null;

			if (!this.consumeStateMachine.isDispatchable(outboxEvent)) {
				writeStructuredLog(OutboxConsumer.name, {
					step: 'outbox_status_not_dispatchable',
					outboxId,
					source,
					status: outboxEvent.status,
				});
				await this.outboxRepository.unlock(outboxId);
				return;
			}

			const claimStartedAt = Date.now();
			const claimed = await this.idempotencyService.claim(
				this.consumerName,
				outboxId,
			);
			const idempotencyClaimMs = Date.now() - claimStartedAt;
			if (!claimed) {
				writeStructuredLog(OutboxConsumer.name, {
					step: 'outbox_duplicate_claim',
					outboxId,
					source,
					eventType: outboxEvent.eventType,
				});
				this.consumeStateMachine.markDuplicateClaimConflict(
					outboxEvent,
				);
				await this.outboxRepository.persist(outboxEvent);
				await this.outboxRepository.unlock(outboxId);
				writeStructuredLog(OutboxConsumer.name, {
					step: 'outbox_duplicate_claim_completed',
					outboxId,
					source,
					eventType: outboxEvent.eventType,
					loadOutboxMs,
					idempotencyClaimMs,
					eventAgeMs,
					publishedLagMs,
					consumeTotalMs: Date.now() - consumeStartedAt,
				});
				return;
			}

			const event = hydrateEvent(
				outboxEvent.eventType,
				outboxEvent.payload,
			);
			if (!event) {
				writeStructuredLog(
					OutboxConsumer.name,
					{
						step: 'outbox_unknown_event_type',
						outboxId,
						source,
						eventType: outboxEvent.eventType,
					},
					'warn',
				);
				this.consumeStateMachine.markUnknownEventTypeFailure(
					outboxEvent,
				);
				await this.outboxRepository.persist(outboxEvent);
				return;
			}

			const handlerStartedAt = Date.now();
			const dispatched = await this.dispatchKnownEvent(
				event,
				outboxEvent.eventType,
			);
			const handlerDispatchMs = Date.now() - handlerStartedAt;
			writeStructuredLog(OutboxConsumer.name, {
				step: 'outbox_event_dispatched',
				outboxId,
				source,
				eventType: outboxEvent.eventType,
				mode: dispatched ? 'known-handler' : 'event-bus',
			});
			if (!dispatched) {
				this.eventBus.publish(event);
			}
			this.consumeStateMachine.markConsumed(outboxEvent);
			const persistStartedAt = Date.now();
			await this.outboxRepository.persist(outboxEvent);
			const persistFinalStateMs = Date.now() - persistStartedAt;
			writeStructuredLog(OutboxConsumer.name, {
				step: 'outbox_marked_consumed',
				outboxId,
				source,
				eventType: outboxEvent.eventType,
				loadOutboxMs,
				idempotencyClaimMs,
				handlerDispatchMs,
				persistFinalStateMs,
				eventAgeMs,
				publishedLagMs,
				consumeTotalMs: Date.now() - consumeStartedAt,
			});
		});
	}

	async consumeRawMessage(record: Pick<SQSRecord, 'body'>): Promise<void> {
		const parsedMessage = this.parseOutboxMessage(record);
		if (!parsedMessage) {
			return;
		}

		const { outboxId, source } = parsedMessage;

		writeStructuredLog(OutboxConsumer.name, {
			step: 'outbox_consume_received',
			outboxId,
			source,
		});

		const locked = await this.tryLockOutbox(outboxId, source);
		if (!locked) {
			return;
		}

		try {
			await this.consumeLockedOutboxWithTransaction(outboxId, source);
		} catch (error) {
			try {
				await this.recoverFailureWithTransaction(
					outboxId,
					source,
					error,
				);
				writeStructuredLog(OutboxConsumer.name, {
					step: 'outbox_unlocked_after_failure',
					outboxId,
					source,
				});
			} catch (recoveryError: unknown) {
				writeStructuredLog(
					OutboxConsumer.name,
					{
						step: 'outbox_failure_recovery_failed',
						outboxId,
						source,
						error: resolveErrorMessage(recoveryError),
					},
					'error',
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
