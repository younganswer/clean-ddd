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
	resolveOutboxMaxAttempts,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';
import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
const OUTBOX_RETRY_DELAY_MS = 60_000;

@CommandHandler(DispatchOutboxEventCommand)
export class DispatchOutboxEventHandler implements ICommandHandler<DispatchOutboxEventCommand> {
	private readonly maxAttempts = resolveOutboxMaxAttempts(
		process.env.OUTBOX_MAX_ATTEMPTS,
	);

	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		@Inject(IOutboxQueueSymbol)
		private readonly outboxQueue: IOutboxQueue,
		private readonly uow: UnitOfWork,
	) {}

	private isDispatchableStatus(status: OutboxEventStatus): boolean {
		return (
			status === OutboxEventStatus.PENDING ||
			status === OutboxEventStatus.FAILED
		);
	}

	async execute(command: DispatchOutboxEventCommand): Promise<void> {
		const outboxId = command.outboxId;
		if (!outboxId) return;
		const current = await this.outboxRepository.findById(outboxId);
		if (!current) return;
		if (!this.isDispatchableStatus(current.status)) return;

		const { messageGroupId } = command;

		try {
			await this.outboxQueue.enqueue(outboxId, {
				messageGroupId,
				source: OutboxDispatchSource.DISPATCHER,
			});
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) return;
				if (!this.isDispatchableStatus(outboxEvent.status)) return;

				outboxEvent.markPublished();
				await this.outboxRepository.persist(outboxEvent);
			});
		} catch (error: unknown) {
			const message = resolveErrorMessage(error);
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) return;

				outboxEvent.recordFailure(
					message,
					createRetryAt(OUTBOX_RETRY_DELAY_MS),
					{ maxAttempts: this.maxAttempts },
				);
				await this.outboxRepository.persist(outboxEvent);
			});
		}
	}
}
