import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetRecentOutboxEventsQuery,
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox';
import {
	GetRecentOutboxEventsResult,
	type RecentOutboxEventResult,
} from '@/shared/outbox/queries/get-recent-outbox-events.result';

@QueryHandler(GetRecentOutboxEventsQuery)
export class GetRecentOutboxEventsHandler implements IQueryHandler<
	GetRecentOutboxEventsQuery,
	GetRecentOutboxEventsResult
> {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
	) {}

	async execute(
		query: GetRecentOutboxEventsQuery,
	): Promise<GetRecentOutboxEventsResult> {
		const events = await this.outboxRepository.findRecent(query.limit);
		const results: RecentOutboxEventResult[] = events.map((event) => ({
			outboxId: event.id,
			eventType: event.eventType,
			payload: event.payload,
			status: event.status,
			recordedAt: event.recordedAt,
		}));

		return new GetRecentOutboxEventsResult(results);
	}
}
