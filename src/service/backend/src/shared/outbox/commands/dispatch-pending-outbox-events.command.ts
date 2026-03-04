import { Command } from '@nestjs/cqrs';
import { toBoundedInt, toDate } from '@/shared/cqrs/input-normalizer';

export class DispatchPendingOutboxEventsCommand extends Command<number> {
	readonly limit: number;

	readonly now: Date;

	constructor(limit: number = 10, now: Date = new Date()) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 10,
		});
		this.now = toDate(now, new Date());
	}
}
