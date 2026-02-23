export const SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE =
	'SHIPPING.CREATE_FOR_ORDER' as const;

export class CreateShipmentForOrderRequestedEvent {
	static readonly eventType = SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE;

	constructor(public readonly orderId: string) {}
}
