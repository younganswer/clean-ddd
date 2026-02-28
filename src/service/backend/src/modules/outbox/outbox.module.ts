import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SqsModule } from '@/lib/queue/sqs.module';
import { ProcessedEventMapper } from '@/shared/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventRepository } from '@/shared/idempotency/infrastructure/processed-event.repository';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import { IProcessedEventRepositorySymbol } from '@/shared/idempotency/domain/i.processed-event.repository';
import { IOutboxRepositorySymbol } from '@/shared/outbox';
import { OutboxCommandHandlers } from '@/modules/outbox/application/commands';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxQueryHandlers } from '@/modules/outbox/application/queries';
import { OutboxSweeper } from '@/modules/outbox/application/outbox.sweeper';
import { OutboxRepository } from '@/modules/outbox/infrastructure/persistence/outbox.repository';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxMapper } from './infrastructure/mappers/outbox.mapper';

@Module({
	imports: [CqrsModule, SqsModule],
	providers: [
		ProcessedEventMapper,
		ProcessedEventRepository,
		{
			provide: IProcessedEventRepositorySymbol,
			useExisting: ProcessedEventRepository,
		},
		IdempotencyService,
		OutboxQueue,
		OutboxProducer,
		OutboxDispatcher,
		OutboxSweeper,
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
		OutboxDispatcher,
		OutboxSweeper,
		IdempotencyService,
		IOutboxRepositorySymbol,
	],
})
export class OutboxModule {}
