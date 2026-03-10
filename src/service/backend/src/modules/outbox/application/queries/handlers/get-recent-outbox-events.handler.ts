import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	IOutboxEventReaderSymbol,
	type IOutboxEventReader,
} from '@/modules/outbox/domains/readers/i.outbox-event.reader';
import { GetRecentOutboxEventsQuery } from '@/modules/outbox/application/queries/get-recent-outbox-events.query';
import { GetRecentOutboxEventsResult } from '@/modules/outbox/application/queries/get-recent-outbox-events.result';

@QueryHandler(GetRecentOutboxEventsQuery)
export class GetRecentOutboxEventsHandler implements IQueryHandler<
	GetRecentOutboxEventsQuery,
	GetRecentOutboxEventsResult
> {
	constructor(
		@Inject(IOutboxEventReaderSymbol)
		private readonly outboxEventReader: IOutboxEventReader,
	) {}

	async execute(
		query: GetRecentOutboxEventsQuery,
	): Promise<GetRecentOutboxEventsResult> {
		return new GetRecentOutboxEventsResult(
			await this.outboxEventReader.findRecent(query.limit),
		);
	}
}
