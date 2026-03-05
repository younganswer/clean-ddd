import { Command } from '@nestjs/cqrs';
import { toBoundedInt, toDate } from '@/shared/cqrs/input-normalizer';

export class DispatchPendingOutboxEventsCommand extends Command<number> {
	readonly limit: number;
	readonly now: Date;

	constructor(input: { limit?: number; now?: Date } = {}) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 10,
		});
		this.now = toDate(input.now, new Date());
	}
}
