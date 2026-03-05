import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { DispatchOutboxEventCommand } from '@/shared/outbox/commands/dispatch-outbox-event.command';
import {
	IOutboxRepositorySymbol,
	IOutboxQueuePortSymbol,
	type IOutboxRepository,
	type IOutboxQueuePort,
} from '@/shared/outbox';
import {
	createRetryAt,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';

@CommandHandler(DispatchOutboxEventCommand)
export class DispatchOutboxEventHandler implements ICommandHandler<DispatchOutboxEventCommand> {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
		@Inject(IOutboxQueuePortSymbol)
		private readonly outboxQueue: IOutboxQueuePort,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: DispatchOutboxEventCommand): Promise<void> {
		const outboxId = command.outboxId;
		if (!outboxId) return;

		const { messageGroupId } = command;

		try {
			await this.outboxQueue.enqueue(outboxId, { messageGroupId });
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) return;

				outboxEvent.markPublished();
				await this.outboxRepository.persist(outboxEvent);
			});
		} catch (error: unknown) {
			const message = resolveErrorMessage(error);
			await this.uow.transaction(async () => {
				const outboxEvent =
					await this.outboxRepository.findById(outboxId);
				if (!outboxEvent) return;

				outboxEvent.recordFailure(message, createRetryAt(30_000));
				await this.outboxRepository.persist(outboxEvent);
			});
		}
	}
}
