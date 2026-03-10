import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetPendingOutboxEventsQuery,
	GetPendingOutboxEventsResult,
} from '@/modules/outbox/application/queries/get-pending-outbox-events.query';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';

@QueryHandler(GetPendingOutboxEventsQuery)
export class GetPendingOutboxEventsHandler implements IQueryHandler<
	GetPendingOutboxEventsQuery,
	GetPendingOutboxEventsResult
> {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
	) {}

	async execute(
		query: GetPendingOutboxEventsQuery,
	): Promise<GetPendingOutboxEventsResult> {
		const events = await this.outboxRepository.findDispatchable(
			query.limit,
			query.now,
		);
		return new GetPendingOutboxEventsResult(events);
	}
}
