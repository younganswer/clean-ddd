import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import type { SQSRecord } from 'aws-lambda';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OutboxEventStatus } from '@/shared/outbox';
import { hydrateEvent } from '@/lib/outbox/event-registry';
import {
  PaymentWebhookFailedEvent,
  PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import {
  PaymentWebhookFailedHandler,
  PaymentWebhookSucceededHandler,
} from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';

@Injectable()
export class OutboxConsumer {
  private readonly logger = new Logger(OutboxConsumer.name);
  private readonly consumerName = 'OutboxConsumer';

  constructor(
    private readonly em: EntityManager,
    private readonly moduleRef: ModuleRef,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly idempotency: IdempotencyService,
    private readonly eventBus: EventBus,
  ) {}

  private async dispatchKnownEvent(
    event: object,
    eventType: string,
  ): Promise<boolean> {
    if (eventType === PaymentWebhookSucceededEvent.eventType) {
      const handler = this.moduleRef.get(PaymentWebhookSucceededHandler, {
        strict: false,
      });
      if (!handler) {
        throw new Error('PaymentWebhookSucceededHandler provider not found');
      }
      await handler.handle(event as PaymentWebhookSucceededEvent);
      return true;
    }

    if (eventType === PaymentWebhookFailedEvent.eventType) {
      const handler = this.moduleRef.get(PaymentWebhookFailedHandler, {
        strict: false,
      });
      if (!handler) {
        throw new Error('PaymentWebhookFailedHandler provider not found');
      }
      await handler.handle(event as PaymentWebhookFailedEvent);
      return true;
    }

    if (eventType === ReserveInventoryForOrderRequestedEvent.eventType) {
      const handler = this.moduleRef.get(
        ReserveInventoryForOrderRequestedHandler,
        {
          strict: false,
        },
      );
      if (!handler) {
        throw new Error(
          'ReserveInventoryForOrderRequestedHandler provider not found',
        );
      }
      await handler.handle(event as ReserveInventoryForOrderRequestedEvent);
      return true;
    }

    if (eventType === CreateShipmentForOrderRequestedEvent.eventType) {
      const handler = this.moduleRef.get(
        CreateShipmentForOrderRequestedHandler,
        {
          strict: false,
        },
      );
      if (!handler) {
        throw new Error(
          'CreateShipmentForOrderRequestedHandler provider not found',
        );
      }
      await handler.handle(event as CreateShipmentForOrderRequestedEvent);
      return true;
    }

    return false;
  }

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async consumeRawMessage(record: Pick<SQSRecord, 'body'>): Promise<void> {
    let outboxId: string | undefined;
    try {
      const parsed = JSON.parse(record.body) as { outboxId?: string };
      outboxId = parsed.outboxId;
    } catch {
      this.logger.warn('invalid message body (not json)');
      return;
    }

    if (!outboxId) {
      this.logger.warn('invalid message body (missing outboxId)');
      return;
    }

    const locked = await this.outboxRepo.lock(
      outboxId,
      new Date(Date.now() + 120_000),
    );
    if (!locked) return;

    try {
      const em = this.emForContext();
      const row = await em.findOne(OutboxEventSchema, { uuid: outboxId });
      if (!row) {
        await this.outboxRepo.unlock(outboxId);
        return;
      }
      if (row.status !== OutboxEventStatus.PENDING) {
        await this.outboxRepo.unlock(outboxId);
        return;
      }

      const claimed = await this.idempotency.claim(this.consumerName, outboxId);
      if (!claimed) {
        await this.outboxRepo.markAsPublished(outboxId);
        return;
      }

      try {
        const event = hydrateEvent(row.eventType, row.payload);
        if (!event) {
          this.logger.warn(`unknown outbox eventType=${row.eventType}`);
          await this.outboxRepo.recordFailure(
            outboxId,
            `unknown eventType=${row.eventType}`,
            new Date(Date.now() + 60_000),
          );
          return;
        }

        const dispatched = await this.dispatchKnownEvent(event, row.eventType);
        if (!dispatched) {
          this.eventBus.publish(event);
        }
        await this.outboxRepo.markAsPublished(outboxId);
      } catch (error: unknown) {
        const maybeError =
          typeof error === 'object' && error !== null
            ? (error as Record<string, unknown>)
            : undefined;
        const message = String(maybeError?.message ?? error);
        await this.outboxRepo.recordFailure(
          outboxId,
          message,
          new Date(Date.now() + 60_000),
        );
        throw error;
      }
    } catch (error) {
      try {
        await this.outboxRepo.unlock(outboxId);
      } catch {
        // ignore
      }
      throw error;
    }
  }
}
