import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { SqsModule } from '@/lib/queue/sqs.module';
import { ProcessedEventMapper } from '@/modules/outbox/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventRepository } from '@/modules/outbox/idempotency/infrastructure/processed-event.repository';
import { IdempotencyService } from '@/modules/outbox/idempotency/idempotency.service';
import { IProcessedEventRepositorySymbol } from '@/modules/outbox/idempotency/domain/i.processed-event.repository';
import { IOutboxQueueSymbol, IOutboxRepositorySymbol } from '@/shared/outbox';
import { OutboxCommandHandlers } from '@/modules/outbox/application/commands';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxQueryHandlers } from '@/modules/outbox/application/queries';
import { OutboxRepository } from '@/modules/outbox/infrastructure/persistence/outbox.repository';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxMapper } from '@/modules/outbox/infrastructure/mappers/outbox.mapper';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { IOutboxProducerSymbol } from '@/shared/outbox/domain/producers/i.outbox.producer';

@Module({
	imports: [CqrsModule, DiscoveryModule, SqsModule],
	providers: [
		ProcessedEventMapper,
		ProcessedEventRepository,
		{
			provide: IProcessedEventRepositorySymbol,
			useExisting: ProcessedEventRepository,
		},
		IdempotencyService,
		OutboxQueue,
		{
			provide: IOutboxQueueSymbol,
			useExisting: OutboxQueue,
		},
		OutboxProducer,
		{
			provide: IOutboxProducerSymbol,
			useExisting: OutboxProducer,
		},
		OutboxDispatcher,
		OutboxKnownHandlerRegistryService,
		OutboxRepository,
		OutboxMapper,
		...OutboxCommandHandlers,
		...OutboxQueryHandlers,
		{
			provide: IOutboxRepositorySymbol,
			useExisting: OutboxRepository,
		},
	],
	exports: [
		OutboxQueue,
		OutboxProducer,
		IOutboxProducerSymbol,
		OutboxDispatcher,
		OutboxKnownHandlerRegistryService,
		IdempotencyService,
		IOutboxQueueSymbol,
		IOutboxRepositorySymbol,
	],
})
export class OutboxModule {}
