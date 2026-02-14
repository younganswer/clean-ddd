import type { OutboxEventDto } from '@/shared/outbox/domain/dto/outbox-event.dto';

export class GetPendingOutboxEventsQuery {
  constructor(
    readonly limit: number = 10,
    readonly now: Date = new Date(),
  ) {}
}

export class GetPendingOutboxEventsResult {
  constructor(readonly events: OutboxEventDto[]) {}
}
