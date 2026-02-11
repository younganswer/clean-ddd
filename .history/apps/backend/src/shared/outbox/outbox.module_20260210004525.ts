import { forwardRef, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { SqsModule } from '../sqs/sqs.module';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { OutboxConsumer } from './outbox.consumer';
import { IOutboxRepositorySymbol } from './i.outbox.repository';
import { OutboxRepository } from './outbox.repository';
import { OutboxQueue } from './outbox.queue';
import { OutboxRouter } from './outbox.router';
import { OutboxSweeper } from './outbox.sweeper';
import { OutboxSweepInterceptor } from './outbox-sweep.interceptor';

@Module({
  imports: [SqsModule, forwardRef(() => PaymentsModule)],
  providers: [
    IdempotencyService,
    OutboxQueue,
    OutboxSweeper,
    OutboxRouter,
    OutboxConsumer,
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
  exports: [IOutboxRepositorySymbol, OutboxQueue],
})
export class OutboxModule {}
