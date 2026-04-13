export const PAYMENT_INTENT_CREATED_EVENT_TYPE =
	'PAYMENT.PAYMENT_INTENT_CREATED' as const;

import {
	PaymentOrderIdRequiredException,
	PaymentWebhookPayloadInvalidException,
} from '@/shared/exceptions';
import {
	toBoundedInt,
	toDate,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

export class PaymentIntentCreatedEvent {
	static readonly eventType = PAYMENT_INTENT_CREATED_EVENT_TYPE;
	public readonly orderId: string;
	public readonly paymentId: string;
	public readonly eventVersion: number;
	public readonly occurredAt: string;
	public readonly aggregateId: string;
	public readonly sequence: number;

	constructor(input: {
		orderId: string;
		paymentId: string;
		eventVersion?: number;
		occurredAt?: string;
		aggregateId?: string;
		sequence?: number;
	}) {
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				PaymentOrderIdRequiredException,
				{ description: 'orderId' },
			);
		}

		const paymentId = toTrimmedString(input.paymentId);
		if (!paymentId) {
			throw ApplicationExceptionFactory.create(
				PaymentWebhookPayloadInvalidException,
				{ description: 'paymentId' },
			);
		}

		this.orderId = orderId;
		this.paymentId = paymentId;
		this.eventVersion = toBoundedInt(input.eventVersion, {
			min: 1,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 1,
		});
		this.occurredAt = toDate(input.occurredAt, new Date()).toISOString();
		this.aggregateId = toTrimmedString(input.aggregateId) || this.orderId;
		this.sequence = toBoundedInt(input.sequence, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
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
			eventVersion: toBoundedInt(payload.eventVersion, {
				min: 1,
				max: Number.MAX_SAFE_INTEGER,
				fallback: 1,
			}),
			occurredAt: toTrimmedString(payload.occurredAt),
			aggregateId: toTrimmedString(payload.aggregateId),
			sequence: toBoundedInt(payload.sequence, {
				min: 0,
				max: Number.MAX_SAFE_INTEGER,
				fallback: 0,
			}),
		});
	}
}
