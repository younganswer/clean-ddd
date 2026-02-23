import { Inject, Injectable } from '@nestjs/common';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { getEventType, toPayload } from '@/lib/outbox/event-registry';

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
    return await this.saveAndEnqueue({
      eventType,
      payload,
      options,
      source: 'publish',
    });
  }

  async emit(
    eventType: string,
    payload: Record<string, unknown>,
    options?: { delaySeconds?: number; messageGroupId?: string },
  ): Promise<string> {
    return await this.saveAndEnqueue({
      eventType,
      payload,
      options,
      source: 'emit',
    });
  }

  private async saveAndEnqueue(input: {
    eventType: string;
    payload: Record<string, unknown>;
    options?: { delaySeconds?: number; messageGroupId?: string };
    source: 'publish' | 'emit';
  }): Promise<string> {
    const { eventType, payload, options, source } = input;

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

    const strictEnqueue = process.env.OUTBOX_ENQUEUE_STRICT !== 'false';

    const safeEnqueue = async (enqueueDelaySeconds?: number) => {
      try {
        await this.outboxQueue.enqueue(outboxId, {
          delaySeconds: enqueueDelaySeconds,
          messageGroupId: inferredMessageGroupId,
        });
        await this.outboxRepo.markAsPublished(outboxId);
      } catch (error) {
        console.error(
          `[OutboxProducer.${source}] enqueue failed`,
          {
            outboxId,
            eventType,
            queue: 'outbox',
            delaySeconds: enqueueDelaySeconds,
          },
          error,
        );
        if (strictEnqueue) throw error;
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
