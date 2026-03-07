export const PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE =
	'PAYMENT_WEBHOOK.PAYMENT_FULFILLMENT_REQUESTED' as const;

import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';

export class PaymentFulfillmentRequestedEvent {
	static readonly eventType = PAYMENT_FULFILLMENT_REQUESTED_EVENT_TYPE;
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		this.orderId = requireTrimmedString(
			input.orderId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
			{ reason: 'orderId' },
		);
	}

	static fromRaw(
		payload: Record<string, unknown>,
	): PaymentFulfillmentRequestedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		if (!orderId) return null;
		return new PaymentFulfillmentRequestedEvent({ orderId });
	}
}
