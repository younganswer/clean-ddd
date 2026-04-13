export const INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE =
	'INVENTORY.RESERVE_FOR_ORDER' as const;

export type InventoryOrderItemPayload = { sku: string; quantity: number };

import { InventoryEventPayloadInvalidException } from '@/shared/exceptions';
import {
	toBoundedInt,
	toDate,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

export class ReserveInventoryForOrderRequestedEvent {
	static readonly eventType =
		INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE;
	public readonly orderId: string;
	public readonly items: InventoryOrderItemPayload[];
	public readonly eventVersion: number;
	public readonly occurredAt: string;
	public readonly aggregateId: string;
	public readonly sequence: number;

	constructor(input: {
		orderId: string;
		items: InventoryOrderItemPayload[];
		eventVersion?: number;
		occurredAt?: string;
		aggregateId?: string;
		sequence?: number;
	}) {
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				InventoryEventPayloadInvalidException,
				{ description: 'orderId' },
			);
		}

		this.orderId = orderId;

		const normalizedItems = Array.isArray(input.items)
			? input.items
					.map((item) => ({
						sku: toTrimmedString(item?.sku),
						quantity: toBoundedInt(item?.quantity, {
							min: 1,
							max: Number.MAX_SAFE_INTEGER,
							fallback: 0,
						}),
					}))
					.filter((item) => item.sku.length > 0 && item.quantity > 0)
			: [];

		if (!normalizedItems.length) {
			throw ApplicationExceptionFactory.create(
				InventoryEventPayloadInvalidException,
				{ cause: { description: 'items' } },
			);
		}

		this.items = normalizedItems;
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
	): ReserveInventoryForOrderRequestedEvent | null {
		const orderId = toTrimmedString(payload.orderId);
		const items = Array.isArray(payload.items)
			? payload.items
					.map((item) => {
						const row = item as Record<string, unknown>;
						return {
							sku: toTrimmedString(row.sku),
							quantity: toBoundedInt(row.quantity, {
								min: 1,
								max: Number.MAX_SAFE_INTEGER,
								fallback: 0,
							}),
						};
					})
					.filter((item) => item.sku && item.quantity > 0)
			: [];

		if (!orderId || !items.length) return null;
		return new ReserveInventoryForOrderRequestedEvent({
			orderId,
			items,
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
