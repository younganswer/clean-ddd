import { Command } from '@nestjs/cqrs';
import { toTrimmedString } from '@/shared/cqrs/input-normalizer';

export class DispatchOutboxEventCommand extends Command<void> {
	readonly outboxId: string;

	readonly messageGroupId: string;

	constructor(outboxId: string, messageGroupId: string = 'outbox') {
		super();
		this.outboxId = toTrimmedString(outboxId);
		this.messageGroupId = toTrimmedString(messageGroupId) || 'outbox';
	}
}
