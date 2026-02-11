import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SqsModule } from '../../sqs/sqs.module';
import { OutboxModule } from './outbox.module';
import { OutboxConsumer } from '../application/outbox.consumer';
import { OutboxSqsPoller } from '../infrastructure/sqs/outbox.sqs-poller';

@Module({
  imports: [CqrsModule, OutboxModule, SqsModule],
  providers: [OutboxConsumer, OutboxSqsPoller],
  exports: [OutboxConsumer],
})
export class OutboxConsumerModule {}
