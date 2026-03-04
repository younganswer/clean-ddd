import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DispatchPendingOutboxEventsCommand } from '@/shared/outbox';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';

@CommandHandler(DispatchPendingOutboxEventsCommand)
export class DispatchPendingOutboxEventsHandler implements ICommandHandler<
	DispatchPendingOutboxEventsCommand,
	number
> {
	constructor(private readonly outboxDispatcher: OutboxDispatcher) {}

	async execute(
		command: DispatchPendingOutboxEventsCommand,
	): Promise<number> {
		const limit = Number.isFinite(command.limit)
			? Math.max(0, Math.trunc(command.limit))
			: 10;
		const now = command.now instanceof Date ? command.now : new Date();
		return await this.outboxDispatcher.dispatchPending(limit, now);
	}
}
