import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox';
import { GetRecentOutboxEventsQuery } from '@/modules/outbox/application/queries/get-recent-outbox-events.query';
import {
	GetRecentOutboxEventsResult,
	type RecentOutboxEventResult,
} from '@/modules/outbox/application/queries/get-recent-outbox-events.result';

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
