import { Command } from '@nestjs/cqrs';

export class DispatchPendingOutboxEventsCommand extends Command<number> {
	constructor(
		readonly limit: number = 10,
		readonly now: Date = new Date(),
	) {
		super();
	}
}
