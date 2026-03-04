import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetRecentOutboxEventsQuery,
	GetRecentOutboxEventsResult,
	type RecentOutboxEventView,
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox';

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
		const views: RecentOutboxEventView[] = events.map((event) => ({
			outboxId: event.id,
			eventType: event.eventType,
			payload: event.payload,
			status: event.status,
			recordedAt: event.recordedAt,
		}));

		return new GetRecentOutboxEventsResult(views);
	}
}
