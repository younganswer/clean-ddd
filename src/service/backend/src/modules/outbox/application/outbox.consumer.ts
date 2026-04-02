import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { SQSRecord } from 'aws-lambda';
import { createHash } from 'node:crypto';
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
import {
	resolveBoundaryErrorMessage,
	writeBoundaryLog,
} from '@/common/logging/non-http-boundary-log';
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
				writeBoundaryLog(
					OutboxConsumer.name,
					{ step: 'outbox_message_body_missing_outbox_id' },
					'warn',
				);
				return null;
			}

			writeBoundaryLog(
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
			writeBoundaryLog(OutboxConsumer.name, {
				step: 'outbox_lock_skipped',
				outboxId,
				source,
			});
			return false;
		}

		writeBoundaryLog(OutboxConsumer.name, {
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
					writeBoundaryLog(
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

				const idempotencyEventId =
					this.resolveIdempotencyEventIdForOutboxEvent(
						outboxEvent.id,
						outboxEvent.eventType,
						outboxEvent.payload,
					);

				this.consumeStateMachine.markDispatchFailure(
					outboxEvent,
					message,
				);
				await this.outboxRepository.persist(outboxEvent);
				writeBoundaryLog(
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
						idempotencyEventId,
					);
				} catch (releaseError: unknown) {
					writeBoundaryLog(
						OutboxConsumer.name,
						{
							step: 'outbox_idempotency_release_failed',
							outboxId,
							idempotencyEventId,
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

	private resolveIdempotencyEventIdForOutboxEvent(
		outboxId: string,
		eventType: string,
		payload: Record<string, unknown>,
	): string {
		const orderingMetadata = this.resolveEventOrderingMetadata(payload);
		if (!orderingMetadata) {
			return outboxId;
		}

		const seed = `${eventType}:${orderingMetadata.aggregateId}:v${orderingMetadata.eventVersion}:s${orderingMetadata.sequence}`;
		const hash = createHash('sha256').update(seed).digest();
		const bytes = Buffer.from(hash.subarray(0, 16));

		bytes[6] = (bytes[6] & 0x0f) | 0x50;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;

		const hex = bytes.toString('hex');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
	}

	private resolveEventOrderingMetadata(payload: Record<string, unknown>): {
		aggregateId: string;
		eventVersion: number;
		sequence: number;
	} | null {
		const aggregateId =
			typeof payload.aggregateId === 'string'
				? payload.aggregateId.trim()
				: '';
		if (!aggregateId) return null;

		const sequenceRaw = Number(payload.sequence);
		if (!Number.isFinite(sequenceRaw) || sequenceRaw < 0) {
			return null;
		}

		const eventVersionRaw = Number(payload.eventVersion);
		const eventVersion =
			Number.isFinite(eventVersionRaw) && eventVersionRaw >= 1
				? Math.trunc(eventVersionRaw)
				: 1;

		return {
			aggregateId,
			eventVersion,
			sequence: Math.trunc(sequenceRaw),
		};
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
				writeBoundaryLog(
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
				writeBoundaryLog(OutboxConsumer.name, {
					step: 'outbox_status_not_dispatchable',
					outboxId,
					source,
					status: outboxEvent.status,
				});
				await this.outboxRepository.unlock(outboxId);
				return;
			}

			const orderingMetadata = this.resolveEventOrderingMetadata(
				outboxEvent.payload,
			);
			if (orderingMetadata) {
				const hasConsumedNewerEvent =
					await this.outboxRepository.hasConsumedNewerEvent({
						eventType: outboxEvent.eventType,
						aggregateId: orderingMetadata.aggregateId,
						eventVersion: orderingMetadata.eventVersion,
						sequence: orderingMetadata.sequence,
					});

				if (hasConsumedNewerEvent) {
					this.consumeStateMachine.markOutOfOrderDiscarded(
						outboxEvent,
					);
					await this.outboxRepository.persist(outboxEvent);
					writeBoundaryLog(OutboxConsumer.name, {
						step: 'outbox_out_of_order_discarded',
						outboxId,
						source,
						eventType: outboxEvent.eventType,
						aggregateId: orderingMetadata.aggregateId,
						eventVersion: orderingMetadata.eventVersion,
						sequence: orderingMetadata.sequence,
						loadOutboxMs,
						eventAgeMs,
						publishedLagMs,
						consumeTotalMs: Date.now() - consumeStartedAt,
					});
					return;
				}
			}

			const idempotencyEventId =
				this.resolveIdempotencyEventIdForOutboxEvent(
					outboxEvent.id,
					outboxEvent.eventType,
					outboxEvent.payload,
				);

			const claimStartedAt = Date.now();
			const claimed = await this.idempotencyService.claim(
				this.consumerName,
				idempotencyEventId,
			);
			const idempotencyClaimMs = Date.now() - claimStartedAt;
			if (!claimed) {
				writeBoundaryLog(OutboxConsumer.name, {
					step: 'outbox_duplicate_claim',
					outboxId,
					idempotencyEventId,
					source,
					eventType: outboxEvent.eventType,
				});
				this.consumeStateMachine.markDuplicateClaimConflict(
					outboxEvent,
				);
				await this.outboxRepository.persist(outboxEvent);
				await this.outboxRepository.unlock(outboxId);
				writeBoundaryLog(OutboxConsumer.name, {
					step: 'outbox_duplicate_claim_completed',
					outboxId,
					idempotencyEventId,
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
				writeBoundaryLog(
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
			writeBoundaryLog(OutboxConsumer.name, {
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
			writeBoundaryLog(OutboxConsumer.name, {
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

		writeBoundaryLog(OutboxConsumer.name, {
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
				writeBoundaryLog(OutboxConsumer.name, {
					step: 'outbox_unlocked_after_failure',
					outboxId,
					source,
				});
			} catch (recoveryError: unknown) {
				writeBoundaryLog(
					OutboxConsumer.name,
					{
						step: 'outbox_failure_recovery_failed',
						outboxId,
						source,
						error: resolveBoundaryErrorMessage(recoveryError),
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
