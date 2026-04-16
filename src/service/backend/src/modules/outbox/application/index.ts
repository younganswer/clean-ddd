import { OutboxCommandHandlers } from '@/modules/outbox/application/commands';
import { OutboxQueryHandlers } from '@/modules/outbox/application/queries';

export const OutboxHandlers = [
	...OutboxCommandHandlers,
	...OutboxQueryHandlers,
];
