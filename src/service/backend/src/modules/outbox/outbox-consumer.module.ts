import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SqsModule } from '@/lib/queue/sqs.module';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { OutboxSqsPoller } from '@/modules/outbox/infrastructure/sqs/outbox.sqs-poller';

const OutboxConsumerImports = [CqrsModule, OutboxModule, SqsModule];

const OutboxConsumerProviders = [
	OutboxConsumer,
	OutboxConsumeStateMachine,
	OutboxSqsPoller,
];

const OutboxConsumerExports = [OutboxConsumer];

@Module({
	imports: OutboxConsumerImports,
	providers: OutboxConsumerProviders,
	exports: OutboxConsumerExports,
})
export class OutboxConsumerModule {}
