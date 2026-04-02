export const SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE =
	'SHIPPING.CREATE_FOR_ORDER' as const;

import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	toBoundedInt,
	toDate,
	requireTrimmedString,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';

export class CreateShipmentForOrderRequestedEvent {
	static readonly eventType = SHIPPING_CREATE_FOR_ORDER_REQUESTED_EVENT_TYPE;
	public readonly orderId: string;
	public readonly eventVersion: number;
	public readonly occurredAt: string;
	public readonly aggregateId: string;
	public readonly sequence: number;

	constructor(input: {
		orderId: string;
		eventVersion?: number;
		occurredAt?: string;
		aggregateId?: string;
		sequence?: number;
	}) {
		this.orderId = requireTrimmedString(
			input.orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPPING_EVENT_PAYLOAD_INVALID,
			{ reason: 'orderId' },
		);
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
	): CreateShipmentForOrderRequestedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		if (!orderId) return null;
		return new CreateShipmentForOrderRequestedEvent({
			orderId,
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
