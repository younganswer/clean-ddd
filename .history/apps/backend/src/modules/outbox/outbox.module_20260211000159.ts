import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SqsModule } from 'src/lib/queue/sqs.module';
import { IdempotencyService } from 'src/shared/idempotency/idempotency.service';
import { IOutboxRepositorySymbol } from 'src/shared/outbox';
import { OutboxCommandHandlers } from './application/commands';
import { OutboxProducer } from './application/outbox.producer';
import { OutboxQueryHandlers } from './application/queries';
import { OutboxSweeper } from './application/outbox.sweeper';
import { OutboxRepository } from './infrastructure/persistence/outbox.repository';
import { OutboxQueue } from './infrastructure/queue/outbox.queue';

@Module({
  imports: [CqrsModule, SqsModule],
  providers: [
    IdempotencyService,
    OutboxQueue,
    OutboxProducer,
    OutboxSweeper,
    OutboxRepository,
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
    OutboxSweeper,
    IdempotencyService,
    IOutboxRepositorySymbol,
  ],
})
export class OutboxModule {}
