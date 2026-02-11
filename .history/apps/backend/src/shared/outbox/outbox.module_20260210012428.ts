import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SqsModule } from '../sqs/sqs.module';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { IOutboxRepositorySymbol } from './i.outbox.repository';
import { OutboxProducer } from './outbox.producer';
import { OutboxRepository } from './outbox.repository';
import { OutboxQueue } from './outbox.queue';
import { OutboxSweeper } from './outbox.sweeper';
import { OutboxSweepInterceptor } from './outbox-sweep.interceptor';

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
  exports: [IOutboxRepositorySymbol, OutboxQueue, OutboxProducer, IdempotencyService],
})
export class OutboxModule {}
