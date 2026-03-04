export const PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE =
	'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED' as const;

import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toTrimmedString,
} from '@/shared/cqrs/input-normalizer';

export class PaymentWebhookSucceededEvent {
	static readonly eventType = PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE;

	public readonly orderId: string;

	public readonly paymentId: string;

	constructor(orderId: string, paymentId: string) {
		this.orderId = requireTrimmedString(
			orderId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
			{ reason: 'orderId' },
		);
		this.paymentId = requireTrimmedString(
			paymentId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
			{ reason: 'paymentId' },
		);
	}

	static fromRaw(
		payload: Record<string, unknown>,
	): PaymentWebhookSucceededEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		const paymentId = toTrimmedString(payload.paymentId);
		if (!orderId || !paymentId) return null;
		return new PaymentWebhookSucceededEvent(orderId, paymentId);
	}
}
