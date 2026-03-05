export const PAYMENT_WEBHOOK_FAILED_EVENT_TYPE =
	'PAYMENT_WEBHOOK.PAYMENT_FAILED' as const;

import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toTrimmedString,
} from '@/shared/cqrs/input-normalizer';

export class PaymentWebhookFailedEvent {
	static readonly eventType = PAYMENT_WEBHOOK_FAILED_EVENT_TYPE;
	public readonly orderId: string;
	public readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		this.orderId = requireTrimmedString(
			input.orderId,
			PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
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
	): PaymentWebhookFailedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		const paymentId = toTrimmedString(payload.paymentId);
		if (!orderId || !paymentId) return null;
		return new PaymentWebhookFailedEvent({ orderId, paymentId });
	}
}
