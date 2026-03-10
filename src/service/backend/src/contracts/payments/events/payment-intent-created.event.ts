export const PAYMENT_INTENT_CREATED_EVENT_TYPE =
	'PAYMENT.PAYMENT_INTENT_CREATED' as const;

import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';

export class PaymentIntentCreatedEvent {
	static readonly eventType = PAYMENT_INTENT_CREATED_EVENT_TYPE;
	public readonly orderId: string;
	public readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		this.orderId = requireTrimmedString(
			input.orderId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_ORDER_ID_REQUIRED,
			{ reason: 'orderId' },
		);
		this.paymentId = requireTrimmedString(
			input.paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
			{ reason: 'paymentId' },
		);
	}

	static fromRaw(
		payload: Record<string, unknown>,
	): PaymentIntentCreatedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		const paymentId = toTrimmedString(payload.paymentId);
		if (!orderId || !paymentId) return null;

		return new PaymentIntentCreatedEvent({
			orderId,
			paymentId,
		});
	}
}
