import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SqsModule } from '../../sqs/sqs.module';
import { IdempotencyService } from '../../idempotency/idempotency.service';
import { IOutboxRepositorySymbol } from '../domain/i.outbox.repository';
import { OutboxProducer } from '../application/outbox.producer';
import { OutboxRepository } from '../infrastructure/persistence/outbox.repository';
import { OutboxQueue } from '../infrastructure/queue/outbox.queue';
import { OutboxSweeper } from '../application/outbox.sweeper';
import { OutboxSweepInterceptor } from '../presentation/outbox-sweep.interceptor';

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
    {
      provide: APP_INTERCEPTOR,
      useClass: OutboxSweepInterceptor,
    },
  ],
  exports: [
    IOutboxRepositorySymbol,
    OutboxQueue,
    OutboxProducer,
    IdempotencyService,
  ],
})
export class OutboxModule {}
