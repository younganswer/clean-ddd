import { Command } from '@nestjs/cqrs';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class DispatchOutboxEventCommand extends Command<void> {
	readonly outboxId: string;
	readonly messageGroupId: string;

	constructor(input: { outboxId: string; messageGroupId?: string }) {
		super();
		this.outboxId = toTrimmedString(input.outboxId);
		this.messageGroupId = toTrimmedString(input.messageGroupId) || 'outbox';
	}
}
