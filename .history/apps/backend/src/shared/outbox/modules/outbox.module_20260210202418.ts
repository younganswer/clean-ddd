import { Module } from '@nestjs/common';
import { SqsModule } from '../../../lib/queue/sqs.module';
import { IdempotencyService } from '../../idempotency/idempotency.service';
import { IOutboxRepositorySymbol } from '../domain/i.outbox.repository';
import { OutboxProducer } from '../application/outbox.producer';
import { OutboxRepository } from '../infrastructure/persistence/outbox.repository';
import { OutboxQueue } from '../infrastructure/queue/outbox.queue';
import { OutboxSweeper } from '../application/outbox.sweeper';

@Module({
  imports: [SqsModule],
  providers: [
    IdempotencyService,
    OutboxQueue,
    OutboxProducer,
    OutboxSweeper,
    OutboxRepository,
    {
      provide: IOutboxRepositorySymbol,
      useExisting: OutboxRepository,
    },
  ],
  exports: [
    IOutboxRepositorySymbol,
    OutboxQueue,
    OutboxProducer,
    OutboxSweeper,
    IdempotencyService,
  ],
})
export class OutboxModule {}
