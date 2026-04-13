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
import type { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { hydrateEvent } from '@/lib/outbox/event-registry';
import { resolveErrorMessage } from '@/modules/outbox/application/outbox-exception.util';
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

type OutboxDispatchSource = NormalizedOutboxDispatchMessage['source'];

type OutboxConsumeTiming = {
	consumeStartedAt: number;
	loadOutboxMs: number;
	eventAgeMs: number;
	publishedLagMs: number | null;
};

type IdempotencyClaimResult =
	| {
			claimed: true;
			idempotencyClaimMs: number;
	  }
	| {
			claimed: false;
	  };

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

	private buildConsumeTiming(
		consumeStartedAt: number,
		outboxEvent: OutboxEvent,
		loadOutboxMs: number,
	): OutboxConsumeTiming {
		return {
			consumeStartedAt,
			loadOutboxMs,
			eventAgeMs: consumeStartedAt - outboxEvent.recordedAt.getTime(),
			publishedLagMs: outboxEvent.publishedAt
				? consumeStartedAt - outboxEvent.publishedAt.getTime()
				: null,
		};
	}

	private toTimingLog(timing: OutboxConsumeTiming): {
		loadOutboxMs: number;
		eventAgeMs: number;
		publishedLagMs: number | null;
		consumeTotalMs: number;
	} {
		return {
			loadOutboxMs: timing.loadOutboxMs,
			eventAgeMs: timing.eventAgeMs,
			publishedLagMs: timing.publishedLagMs,
			consumeTotalMs: Date.now() - timing.consumeStartedAt,
		};
	}

	private async handleMissingOutboxEvent(
		outboxId: string,
		source: OutboxDispatchSource,
	): Promise<void> {
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
	}

	private async handleNonDispatchableOutboxEventIfNeeded(
		outboxEvent: OutboxEvent,
		outboxId: string,
		source: OutboxDispatchSource,
	): Promise<boolean> {
		if (this.consumeStateMachine.isDispatchable(outboxEvent)) {
			return false;
		}

		writeBoundaryLog(OutboxConsumer.name, {
			step: 'outbox_status_not_dispatchable',
			outboxId,
			source,
			status: outboxEvent.status,
		});
		await this.outboxRepository.unlock(outboxId);
		return true;
	}

	private async handleOutOfOrderEventIfNeeded(
		outboxEvent: OutboxEvent,
		outboxId: string,
		source: OutboxDispatchSource,
		timing: OutboxConsumeTiming,
	): Promise<boolean> {
		const orderingMetadata = this.resolveEventOrderingMetadata(
			outboxEvent.payload,
		);
		if (!orderingMetadata) {
			return false;
		}

		const hasConsumedNewerEvent =
			await this.outboxRepository.hasConsumedNewerEvent({
				eventType: outboxEvent.eventType,
				aggregateId: orderingMetadata.aggregateId,
				eventVersion: orderingMetadata.eventVersion,
				sequence: orderingMetadata.sequence,
			});
		if (!hasConsumedNewerEvent) {
			return false;
		}

		this.consumeStateMachine.markOutOfOrderDiscarded(outboxEvent);
		await this.outboxRepository.persist(outboxEvent);
		writeBoundaryLog(OutboxConsumer.name, {
			step: 'outbox_out_of_order_discarded',
			outboxId,
			source,
			eventType: outboxEvent.eventType,
			aggregateId: orderingMetadata.aggregateId,
			eventVersion: orderingMetadata.eventVersion,
			sequence: orderingMetadata.sequence,
			...this.toTimingLog(timing),
		});

		return true;
	}

	private async claimIdempotencyOrHandleDuplicate(
		outboxEvent: OutboxEvent,
		outboxId: string,
		source: OutboxDispatchSource,
		timing: OutboxConsumeTiming,
	): Promise<IdempotencyClaimResult> {
		const idempotencyEventId = this.resolveIdempotencyEventIdForOutboxEvent(
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
		if (claimed) {
			return {
				claimed: true,
				idempotencyClaimMs,
			};
		}

		writeBoundaryLog(OutboxConsumer.name, {
			step: 'outbox_duplicate_claim',
			outboxId,
			idempotencyEventId,
			source,
			eventType: outboxEvent.eventType,
		});
		this.consumeStateMachine.markDuplicateClaimConflict(outboxEvent);
		await this.outboxRepository.persist(outboxEvent);
		await this.outboxRepository.unlock(outboxId);
		writeBoundaryLog(OutboxConsumer.name, {
			step: 'outbox_duplicate_claim_completed',
			outboxId,
			idempotencyEventId,
			source,
			eventType: outboxEvent.eventType,
			idempotencyClaimMs,
			...this.toTimingLog(timing),
		});

		return {
			claimed: false,
		};
	}

	private async hydrateEventOrHandleUnknownType(
		outboxEvent: OutboxEvent,
		outboxId: string,
		source: OutboxDispatchSource,
	): Promise<object | null> {
		const event = hydrateEvent(outboxEvent.eventType, outboxEvent.payload);
		if (event) {
			return event;
		}

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
		this.consumeStateMachine.markUnknownEventTypeFailure(outboxEvent);
		await this.outboxRepository.persist(outboxEvent);

		return null;
	}

	private async dispatchAndPersistConsumed(
		outboxEvent: OutboxEvent,
		event: object,
		outboxId: string,
		source: OutboxDispatchSource,
		timing: OutboxConsumeTiming,
		idempotencyClaimMs: number,
	): Promise<void> {
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
			idempotencyClaimMs,
			handlerDispatchMs,
			persistFinalStateMs,
			...this.toTimingLog(timing),
		});
	}

	private async recoverConsumeFailure(
		outboxId: string,
		source: OutboxDispatchSource,
		error: unknown,
	): Promise<void> {
		try {
			await this.recoverFailureWithTransaction(outboxId, source, error);
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
	}

	private async consumeLockedOutboxWithRecovery(
		outboxId: string,
		source: OutboxDispatchSource,
	): Promise<void> {
		try {
			await this.consumeLockedOutboxWithTransaction(outboxId, source);
		} catch (error) {
			await this.recoverConsumeFailure(outboxId, source, error);
			throw error;
		}
	}

	private async loadOutboxEventWithTiming(
		outboxId: string,
		source: OutboxDispatchSource,
		consumeStartedAt: number,
	): Promise<{
		outboxEvent: OutboxEvent;
		timing: OutboxConsumeTiming;
	} | null> {
		const loadStartedAt = Date.now();
		const outboxEvent = await this.outboxRepository.findById(outboxId);
		const loadOutboxMs = Date.now() - loadStartedAt;
		if (!outboxEvent) {
			await this.handleMissingOutboxEvent(outboxId, source);
			return null;
		}

		return {
			outboxEvent,
			timing: this.buildConsumeTiming(
				consumeStartedAt,
				outboxEvent,
				loadOutboxMs,
			),
		};
	}

	private async consumeLockedOutboxWithTransaction(
		outboxId: string,
		source: OutboxDispatchSource,
	): Promise<void> {
		const consumeStartedAt = Date.now();
		await this.uow.transaction(async () => {
			const loaded = await this.loadOutboxEventWithTiming(
				outboxId,
				source,
				consumeStartedAt,
			);
			if (!loaded) {
				return;
			}

			const { outboxEvent, timing } = loaded;

			const isNonDispatchable =
				await this.handleNonDispatchableOutboxEventIfNeeded(
					outboxEvent,
					outboxId,
					source,
				);
			if (isNonDispatchable) {
				return;
			}

			const wasOutOfOrder = await this.handleOutOfOrderEventIfNeeded(
				outboxEvent,
				outboxId,
				source,
				timing,
			);
			if (wasOutOfOrder) {
				return;
			}

			const claimResult = await this.claimIdempotencyOrHandleDuplicate(
				outboxEvent,
				outboxId,
				source,
				timing,
			);
			if (!claimResult.claimed) {
				return;
			}

			const event = await this.hydrateEventOrHandleUnknownType(
				outboxEvent,
				outboxId,
				source,
			);
			if (!event) {
				return;
			}

			await this.dispatchAndPersistConsumed(
				outboxEvent,
				event,
				outboxId,
				source,
				timing,
				claimResult.idempotencyClaimMs,
			);
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

		await this.consumeLockedOutboxWithRecovery(outboxId, source);
	}
}
