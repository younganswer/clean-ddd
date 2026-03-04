import { GetPendingOutboxEventsHandler } from '@/modules/outbox/application/queries/handlers/get-pending-outbox-events.handler';
import { GetRecentOutboxEventsHandler } from '@/modules/outbox/application/queries/handlers/get-recent-outbox-events.handler';

export const OutboxQueryHandlers = [
	GetPendingOutboxEventsHandler,
	GetRecentOutboxEventsHandler,
];
