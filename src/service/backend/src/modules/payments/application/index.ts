import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import { HandlePaymentWebhookFailedHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-failed.handler';
import { HandlePaymentWebhookSucceededHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-succeeded.handler';
import { GetPaymentIntentHandler } from '@/modules/payments/application/queries/handlers/get-payment-intent.handler';
import { ListPaymentIntentsHandler } from '@/modules/payments/application/queries/handlers/list-payment-intents.handler';

export const PaymentsHandlers = [
	CreatePaymentIntentHandler,
	HandlePaymentWebhookSucceededHandler,
	HandlePaymentWebhookFailedHandler,
	GetPaymentIntentHandler,
	ListPaymentIntentsHandler,
];
