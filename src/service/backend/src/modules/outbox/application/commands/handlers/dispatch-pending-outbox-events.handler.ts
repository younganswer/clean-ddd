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
		return await this.outboxDispatcher.dispatchPending(
			command.limit,
			command.now,
		);
	}
}
