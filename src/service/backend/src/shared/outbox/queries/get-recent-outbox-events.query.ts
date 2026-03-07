import { Query } from '@nestjs/cqrs';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';
import { GetRecentOutboxEventsResult } from '@/shared/outbox/queries/get-recent-outbox-events.result';

export class GetRecentOutboxEventsQuery extends Query<GetRecentOutboxEventsResult> {
	readonly limit: number;

	constructor(input: { limit?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 200,
		});
	}
}
