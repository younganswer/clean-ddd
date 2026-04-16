import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { SqsModule } from '@/lib/queue/sqs.module';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import { IOutboxQueueSymbol } from '@/shared/outbox/domain/queue/i.outbox.queue';
import { IOutboxRepositorySymbol } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxProviders } from '@/modules/outbox/domains';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { IOutboxProducerSymbol } from '@/shared/outbox/domain/producers/i.outbox.producer';
import { IOutboxEventReaderSymbol } from '@/modules/outbox/domains/readers/i.outbox-event.reader';
import { IOutboxDelayedDispatchTriggerSymbol } from '@/shared/outbox/domain/schedulers/i.outbox-delayed-dispatch-trigger';

const OutboxImports = [CqrsModule, DiscoveryModule, SqsModule];

const OutboxExports = [
	OutboxQueue,
	OutboxProducer,
	IOutboxDelayedDispatchTriggerSymbol,
	IOutboxProducerSymbol,
	OutboxDispatcher,
	OutboxKnownHandlerRegistryService,
	IdempotencyService,
	IOutboxQueueSymbol,
	IOutboxRepositorySymbol,
	IOutboxEventReaderSymbol,
];

@Module({
	imports: OutboxImports,
	providers: OutboxProviders,
	exports: OutboxExports,
})
export class OutboxModule {}
