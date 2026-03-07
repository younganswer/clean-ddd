import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DispatchPendingOutboxEventsCommand } from '@/modules/outbox/application/commands/dispatch-pending-outbox-events.command';
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
		return await this.outboxDispatcher.dispatchPending(
			command.limit,
			command.now,
		);
	}
}
