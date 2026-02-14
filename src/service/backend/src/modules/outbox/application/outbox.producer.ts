import { Inject, Injectable } from '@nestjs/common';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from 'src/shared/outbox';
import { OutboxQueue } from '../infrastructure/queue/outbox.queue';
import { getEventType, toPayload } from 'src/lib/outbox/event-registry';

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

    const strictEnqueue =
      process.env.OUTBOX_ENQUEUE_STRICT === 'true' ||
      process.env.NODE_ENV === 'production';

    const safeEnqueue = async (enqueueDelaySeconds?: number) => {
      try {
        await this.outboxQueue.enqueue(outboxId, {
          delaySeconds: enqueueDelaySeconds,
          messageGroupId: inferredMessageGroupId,
        });
      } catch (e) {
        console.error(
          '[OutboxProducer.publish] enqueue failed',
          {
            outboxId,
            eventType,
            queue: 'outbox',
            delaySeconds: enqueueDelaySeconds,
          },
          e,
        );
        if (strictEnqueue) throw e;
      }
    };

    if (
      disableDelaySeconds &&
      typeof delaySeconds === 'number' &&
      delaySeconds > 0
    ) {
      setTimeout(() => {
        void safeEnqueue(undefined);
      }, delaySeconds * 1000);

      return outboxId;
    }

    await safeEnqueue(delaySeconds);

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

    const strictEnqueue =
      process.env.OUTBOX_ENQUEUE_STRICT === 'true' ||
      process.env.NODE_ENV === 'production';

    const safeEnqueue = async (enqueueDelaySeconds?: number) => {
      try {
        await this.outboxQueue.enqueue(outboxId, {
          delaySeconds: enqueueDelaySeconds,
          messageGroupId: inferredMessageGroupId,
        });
      } catch (e) {
        console.error(
          '[OutboxProducer.emit] enqueue failed',
          {
            outboxId,
            eventType,
            queue: 'outbox',
            delaySeconds: enqueueDelaySeconds,
          },
          e,
        );
        if (strictEnqueue) throw e;
      }
    };

    if (
      disableDelaySeconds &&
      typeof delaySeconds === 'number' &&
      delaySeconds > 0
    ) {
      setTimeout(() => {
        void safeEnqueue(undefined);
      }, delaySeconds * 1000);

      return outboxId;
    }

    await safeEnqueue(delaySeconds);

    return outboxId;
  }
}
