import {
	PaymentFulfillmentRequestedEvent,
	PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE,
	PaymentWebhookFailedEvent,
	PAYMENT_WEBHOOK_FAILED_EVENT_TYPE,
	PaymentWebhookSucceededEvent,
	PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE,
} from '@/contracts/payments';
import {
	ReserveInventoryForOrderRequestedEvent,
	INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE,
} from '@/contracts/inventory';
import {
	CreateShipmentForOrderRequestedEvent,
	SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE,
} from '@/contracts/shipping';

export type OutboxEventType =
	| typeof PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE
	| typeof PAYMENT_WEBHOOK_FAILED_EVENT_TYPE
	| typeof PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE
	| typeof INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE
	| typeof SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE;

export type KnownOutboxEvent =
	| PaymentWebhookSucceededEvent
	| PaymentWebhookFailedEvent
	| PaymentFulfillmentRequestedEvent
	| ReserveInventoryForOrderRequestedEvent
	| CreateShipmentForOrderRequestedEvent;

type OutboxEventByType = {
	[PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE]: PaymentWebhookSucceededEvent;
	[PAYMENT_WEBHOOK_FAILED_EVENT_TYPE]: PaymentWebhookFailedEvent;
	[PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE]: PaymentFulfillmentRequestedEvent;
	[INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE]: ReserveInventoryForOrderRequestedEvent;
	[SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE]: CreateShipmentForOrderRequestedEvent;
};

export type UnknownOutboxEventPayload = Record<string, unknown>;

const OUTBOX_EVENT_HYDRATORS: {
	[K in OutboxEventType]: (
		payload: UnknownOutboxEventPayload,
	) => OutboxEventByType[K] | null;
} = {
	[PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE]: (payload) =>
		PaymentWebhookSucceededEvent.fromRaw(payload),
	[PAYMENT_WEBHOOK_FAILED_EVENT_TYPE]: (payload) =>
		PaymentWebhookFailedEvent.fromRaw(payload),
	[PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE]: (payload) =>
		PaymentFulfillmentRequestedEvent.fromRaw(payload),
	[INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE]: (payload) =>
		ReserveInventoryForOrderRequestedEvent.fromRaw(payload),
	[SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE]: (payload) =>
		CreateShipmentForOrderRequestedEvent.fromRaw(payload),
};

export const KNOWN_OUTBOX_EVENT_TYPES = Object.freeze(
	Object.keys(OUTBOX_EVENT_HYDRATORS) as OutboxEventType[],
);

export function isKnownOutboxEventType(
	value: string,
): value is OutboxEventType {
	return (KNOWN_OUTBOX_EVENT_TYPES as readonly string[]).includes(value);
}

export function getEventType(event: object): string {
	const ctor = (event as { constructor?: unknown }).constructor as
		| { eventType?: string; name?: string }
		| undefined;
	if (ctor?.eventType && typeof ctor.eventType === 'string')
		return ctor.eventType;

	const maybe = event as { eventType?: unknown };
	if (typeof maybe.eventType === 'string') return maybe.eventType;

	return String(ctor?.name ?? 'UnknownEvent');
}

export function toPayload(event: object): UnknownOutboxEventPayload {
	// keep it simple: class instances with public readonly fields become plain objects.
	return { ...(event as Record<string, unknown>) };
}

export function hydrateEvent(
	eventType: string,
	payload: UnknownOutboxEventPayload,
): KnownOutboxEvent | null {
	if (!isKnownOutboxEventType(eventType)) {
		return null;
	}

	return OUTBOX_EVENT_HYDRATORS[eventType](payload);
}
