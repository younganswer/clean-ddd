import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import {
	IOutboxQueueSymbol,
	type IOutboxQueue,
} from '@/shared/outbox/domain/queue/i.outbox.queue';
import {
	createRetryAt,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';
import {
	measureAsyncStep,
	writeStructuredLog,
} from '@/common/logging/structured-log';

@CommandHandler(DispatchOutboxEventCommand)
export class DispatchOutboxEventHandler implements ICommandHandler<DispatchOutboxEventCommand> {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		@Inject(IOutboxQueueSymbol)
		private readonly outboxQueue: IOutboxQueue,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: DispatchOutboxEventCommand): Promise<void> {
		const outboxId = command.outboxId;
		if (!outboxId) return;
		const startedAt = Date.now();

		const { messageGroupId } = command;

		try {
			const { durationMs: enqueueMs } = await measureAsyncStep(
				async () => {
					await this.outboxQueue.enqueue(outboxId, {
						messageGroupId,
					});
				},
			);
			const { durationMs: markPublishedMs } = await measureAsyncStep(
				async () => {
					await this.uow.transaction(async () => {
						const outboxEvent =
							await this.outboxRepository.findById(outboxId);
						if (!outboxEvent) return;

						outboxEvent.markPublished();
						await this.outboxRepository.persist(outboxEvent);
					});
				},
			);
			writeStructuredLog(DispatchOutboxEventHandler.name, {
				step: 'outbox_event_enqueued',
				outboxId,
				messageGroupId,
				enqueueMs,
				markPublishedMs,
				totalMs: Date.now() - startedAt,
			});
		} catch (error: unknown) {
			const message = resolveErrorMessage(error);
			const { durationMs: markFailureMs } = await measureAsyncStep(
				async () => {
					await this.uow.transaction(async () => {
						const outboxEvent =
							await this.outboxRepository.findById(outboxId);
						if (!outboxEvent) return;

						outboxEvent.recordFailure(
							message,
							createRetryAt(30_000),
						);
						await this.outboxRepository.persist(outboxEvent);
					});
				},
			);
			writeStructuredLog(
				DispatchOutboxEventHandler.name,
				{
					step: 'outbox_enqueue_failed',
					outboxId,
					messageGroupId,
					error: message,
					markFailureMs,
					totalMs: Date.now() - startedAt,
				},
				'error',
			);
		}
	}
}
