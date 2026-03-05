export const SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE =
	'SHIPPING.CREATE_FOR_ORDER' as const;

import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toTrimmedString,
} from '@/shared/cqrs/input-normalizer';

export class CreateShipmentForOrderRequestedEvent {
	static readonly eventType = SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE;
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		this.orderId = requireTrimmedString(
			input.orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPPING_EVENT_PAYLOAD_INVALID,
			{ reason: 'orderId' },
		);
	}

	static fromRaw(
		payload: Record<string, unknown>,
	): CreateShipmentForOrderRequestedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		if (!orderId) return null;
		return new CreateShipmentForOrderRequestedEvent({ orderId });
	}
}
