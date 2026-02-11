import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetPendingOutboxEventsQuery,
  GetPendingOutboxEventsResult,
} from 'src/shared/outbox/queries/get-pending-outbox-events.query';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from 'src/shared/outbox';

@QueryHandler(GetPendingOutboxEventsQuery)
export class GetPendingOutboxEventsHandler implements IQueryHandler<
  GetPendingOutboxEventsQuery,
  GetPendingOutboxEventsResult
> {
  constructor(
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
  ) {}

  async execute(
    query: GetPendingOutboxEventsQuery,
  ): Promise<GetPendingOutboxEventsResult> {
    const limit = Number.isFinite(query.limit) ? Math.max(0, query.limit) : 10;
    const now = query.now instanceof Date ? query.now : new Date();
    const events = await this.outboxRepo.findDispatchable(limit, now);
    return new GetPendingOutboxEventsResult(events);
  }
}
