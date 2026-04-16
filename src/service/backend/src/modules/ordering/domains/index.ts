import { OrderingHandlers } from '@/modules/ordering/application';
import { AttachPaymentOnPaymentIntentCreatedHandler } from '@/modules/ordering/application/events/handlers/attach-payment-on-payment-intent-created.handler';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderReaderProvider } from '@/modules/ordering/infrastructure/readers/order.reader';
import { OrderRepositoryProviders } from '@/modules/ordering/infrastructure/repositories/order.repository';

export const OrderingProviders = [
	OrderMapper,
	...OrderRepositoryProviders,
	OrderReaderProvider,
	...OrderingHandlers,
	AttachPaymentOnPaymentIntentCreatedHandler,
	MarkOrderPaidOnPaymentWebhookSucceededHandler,
];
