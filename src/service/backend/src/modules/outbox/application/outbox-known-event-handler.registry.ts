import type { Type } from '@nestjs/common';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import {
	PaymentWebhookFailedHandler,
	PaymentWebhookSucceededHandler,
} from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';

type OutboxKnownHandler = {
	handle(event: object): Promise<void>;
};

export interface OutboxKnownEventHandlerRegistration {
	token: Type<OutboxKnownHandler>;
	handlerName: string;
}

export const OUTBOX_KNOWN_EVENT_HANDLER_REGISTRY: Readonly<
	Record<string, OutboxKnownEventHandlerRegistration>
> = {
	[PaymentWebhookSucceededEvent.eventType]: {
		token: PaymentWebhookSucceededHandler,
		handlerName: 'PaymentWebhookSucceededHandler',
	},
	[PaymentWebhookFailedEvent.eventType]: {
		token: PaymentWebhookFailedHandler,
		handlerName: 'PaymentWebhookFailedHandler',
	},
	[ReserveInventoryForOrderRequestedEvent.eventType]: {
		token: ReserveInventoryForOrderRequestedHandler,
		handlerName: 'ReserveInventoryForOrderRequestedHandler',
	},
	[CreateShipmentForOrderRequestedEvent.eventType]: {
		token: CreateShipmentForOrderRequestedHandler,
		handlerName: 'CreateShipmentForOrderRequestedHandler',
	},
} as const;
