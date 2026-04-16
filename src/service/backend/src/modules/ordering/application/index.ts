import { OrderingCommandHandlers } from '@/modules/ordering/application/commands';
import { OrderingQueryHandlers } from '@/modules/ordering/application/queries';

export const OrderingHandlers = [
	...OrderingCommandHandlers,
	...OrderingQueryHandlers,
];
