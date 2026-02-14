import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SqsModule } from '@/lib/queue/sqs.module';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { OutboxSqsPoller } from '@/modules/outbox/infrastructure/sqs/outbox.sqs-poller';

@Module({
  imports: [CqrsModule, OutboxModule, SqsModule],
  providers: [OutboxConsumer, OutboxSqsPoller],
  exports: [OutboxConsumer],
})
export class OutboxConsumerModule {}
