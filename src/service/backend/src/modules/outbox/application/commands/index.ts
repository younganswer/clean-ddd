import { DispatchOutboxEventHandler } from '@/modules/outbox/application/commands/handlers/dispatch-outbox-event.handler';
import { DispatchPendingOutboxEventsHandler } from '@/modules/outbox/application/commands/handlers/dispatch-pending-outbox-events.handler';

export const OutboxCommandHandlers = [
	DispatchOutboxEventHandler,
	DispatchPendingOutboxEventsHandler,
];
