import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { DispatchOutboxEventCommand } from '@/shared/outbox/commands/dispatch-outbox-event.command';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import {
	createRetryAt,
	resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';

@CommandHandler(DispatchOutboxEventCommand)
export class DispatchOutboxEventHandler implements ICommandHandler<DispatchOutboxEventCommand> {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepo: IOutboxRepository,
		private readonly outboxQueue: OutboxQueue,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: DispatchOutboxEventCommand): Promise<void> {
		const outboxId = String(command.outboxId ?? '').trim();
		if (!outboxId) return;

		const messageGroupId =
			String(command.messageGroupId ?? '').trim() || 'outbox';

		try {
			await this.outboxQueue.enqueue(outboxId, { messageGroupId });
			await this.uow.transaction(async () => {
				const outboxEvent = await this.outboxRepo.findById(outboxId);
				if (!outboxEvent) return;

				outboxEvent.markPublished();
				await this.outboxRepo.persist(outboxEvent);
			});
		} catch (error: unknown) {
			const message = resolveErrorMessage(error);
			await this.uow.transaction(async () => {
				const outboxEvent = await this.outboxRepo.findById(outboxId);
				if (!outboxEvent) return;

				outboxEvent.recordFailure(message, createRetryAt(30_000));
				await this.outboxRepo.persist(outboxEvent);
			});
		}
	}
}
