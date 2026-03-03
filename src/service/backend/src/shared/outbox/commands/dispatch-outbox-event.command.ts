import { Command } from '@nestjs/cqrs';

export class DispatchOutboxEventCommand extends Command<void> {
	constructor(
		readonly outboxId: string,
		readonly messageGroupId: string = 'outbox',
	) {
		super();
	}
}
