export class DispatchOutboxEventCommand {
	constructor(
		readonly outboxId: string,
		readonly messageGroupId: string = 'outbox',
	) {}
}
