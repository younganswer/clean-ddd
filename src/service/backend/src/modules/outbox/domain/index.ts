import { OutboxHandlers } from '@/modules/outbox/application';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { OutboxProducerProviders } from '@/modules/outbox/application/outbox.producer';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import { ProcessedEventMapper } from '@/modules/outbox/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventRepositoryProviders } from '@/modules/outbox/idempotency/infrastructure/processed-event.repository';
import { OutboxMapper } from '@/modules/outbox/infrastructure/mappers/outbox.mapper';
import { OutboxRepositoryProviders } from '@/modules/outbox/infrastructure/persistence/outbox.repository';
import { OutboxQueueProviders } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxEventReaderProvider } from '@/modules/outbox/infrastructure/readers/outbox-event.reader';
import { OutboxDelayedDispatchTriggerProviders } from '@/modules/outbox/infrastructure/schedulers/outbox-delayed-dispatch-trigger.adapter';

export const OutboxProviders = [
	ProcessedEventMapper,
	...ProcessedEventRepositoryProviders,
	IdempotencyService,
	...OutboxQueueProviders,
	...OutboxProducerProviders,
	...OutboxDelayedDispatchTriggerProviders,
	OutboxDispatcher,
	OutboxKnownHandlerRegistryService,
	...OutboxRepositoryProviders,
	OutboxMapper,
	OutboxEventReaderProvider,
	...OutboxHandlers,
];
