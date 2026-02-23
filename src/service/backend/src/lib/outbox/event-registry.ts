import {
	PaymentWebhookFailedEvent,
	PAYMENT_WEBHOOK_FAILED_EVENT_TYPE,
	PaymentWebhookSucceededEvent,
	PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE,
} from '@/shared/payments';
import {
	ReserveInventoryForOrderRequestedEvent,
	INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE,
} from '@/shared/inventory';
import {
	CreateShipmentForOrderRequestedEvent,
	SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE,
} from '@/shared/shipping';

export type OutboxEventType =
	| typeof PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE
	| typeof PAYMENT_WEBHOOK_FAILED_EVENT_TYPE
	| typeof INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE
	| typeof SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE;

export type KnownOutboxEvent =
	| PaymentWebhookSucceededEvent
	| PaymentWebhookFailedEvent
	| ReserveInventoryForOrderRequestedEvent
	| CreateShipmentForOrderRequestedEvent;

export type UnknownOutboxEventPayload = Record<string, unknown>;

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
	switch (eventType) {
		case PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE:
			return new PaymentWebhookSucceededEvent(
				typeof payload.orderId === 'string' ? payload.orderId : '',
				typeof payload.paymentId === 'string' ? payload.paymentId : '',
			);
		case PAYMENT_WEBHOOK_FAILED_EVENT_TYPE:
			return new PaymentWebhookFailedEvent(
				typeof payload.orderId === 'string' ? payload.orderId : '',
				typeof payload.paymentId === 'string' ? payload.paymentId : '',
			);
		case INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE:
			return new ReserveInventoryForOrderRequestedEvent(
				typeof payload.orderId === 'string' ? payload.orderId : '',
				Array.isArray(payload.items)
					? (payload.items as Array<Record<string, unknown>>)
							.map((i) => ({
								sku: typeof i.sku === 'string' ? i.sku : '',
								quantity:
									typeof i.quantity === 'number'
										? i.quantity
										: Number(i.quantity ?? 0),
							}))
							.filter(
								(i) =>
									i.sku &&
									Number.isFinite(i.quantity) &&
									i.quantity > 0,
							)
					: [],
			);
		case SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE:
			return new CreateShipmentForOrderRequestedEvent(
				typeof payload.orderId === 'string' ? payload.orderId : '',
			);
		default:
			return null;
	}
}
