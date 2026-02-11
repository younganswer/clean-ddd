import { Inject, Injectable } from '@nestjs/common';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from '../domain/i.outbox.repository';
import { OutboxQueue } from '../infrastructure/queue/outbox.queue';
import { getEventType, toPayload } from '../../../lib/outbox/event-registry';

@Injectable()
export class OutboxProducer {
  constructor(
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  async publish(
    event: object,
    options?: { delaySeconds?: number; messageGroupId?: string },
  ): Promise<string> {
    const eventType = getEventType(event);
    const payload = toPayload(event);

    const outboxId = await this.outboxRepo.save({
      eventType,
      payload,
    });

    const delaySeconds = options?.delaySeconds;
    const disableDelaySeconds =
      process.env.SQS_DISABLE_DELAY_SECONDS === 'true';

    const inferredMessageGroupId =
      options?.messageGroupId ??
      (typeof payload.orderId === 'string' && payload.orderId
        ? payload.orderId
        : 'outbox');

    if (
      disableDelaySeconds &&
      typeof delaySeconds === 'number' &&
      delaySeconds > 0
    ) {
      setTimeout(() => {
        void this.outboxQueue.enqueue(outboxId, {
          messageGroupId: inferredMessageGroupId,
        });
      }, delaySeconds * 1000);

      return outboxId;
    }

    await this.outboxQueue.enqueue(outboxId, {
      delaySeconds,
      messageGroupId: inferredMessageGroupId,
    });

    return outboxId;
  }

  async emit(
    eventType: string,
    payload: Record<string, unknown>,
    options?: { delaySeconds?: number; messageGroupId?: string },
  ): Promise<string> {
    const outboxId = await this.outboxRepo.save({
      eventType,
      payload,
    });

    const delaySeconds = options?.delaySeconds;
    const disableDelaySeconds =
      process.env.SQS_DISABLE_DELAY_SECONDS === 'true';

    const inferredMessageGroupId =
      options?.messageGroupId ??
      (typeof payload.orderId === 'string' && payload.orderId
        ? payload.orderId
        : 'outbox');

    if (
      disableDelaySeconds &&
      typeof delaySeconds === 'number' &&
      delaySeconds > 0
    ) {
      setTimeout(() => {
        void this.outboxQueue.enqueue(outboxId, {
          messageGroupId: inferredMessageGroupId,
        });
      }, delaySeconds * 1000);

      return outboxId;
    }

    await this.outboxQueue.enqueue(outboxId, {
      delaySeconds,
      messageGroupId: inferredMessageGroupId,
    });

    return outboxId;
  }
}
