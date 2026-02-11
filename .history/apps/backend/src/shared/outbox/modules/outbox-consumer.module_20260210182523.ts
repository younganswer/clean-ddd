import { Module } from '@nestjs/common';
import { SqsModule } from '../../sqs/sqs.module';
import { OutboxModule } from './outbox.module';
import { OutboxConsumer } from '../application/outbox.consumer';
import { OutboxSqsPoller } from '../infrastructure/sqs/outbox.sqs-poller';

@Module({
  imports: [OutboxModule, SqsModule],
  providers: [OutboxConsumer, OutboxSqsPoller],
  exports: [OutboxConsumer],
})
export class OutboxConsumerModule {}
