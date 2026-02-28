import { BaseEntity } from '@/shared/domain/base.entity';
import { randomUUID } from 'node:crypto';

export class InventoryReservation extends BaseEntity {
	private constructor(
		id: string,
		private readonly _orderId: string,
		private readonly _sku: string,
		private readonly _quantity: number,
	) {
		super(id);
	}

	static create(input: {
		orderId: string;
		sku: string;
		quantity: number;
	}): InventoryReservation {
		const orderId = String(input.orderId ?? '').trim();
		const sku = String(input.sku ?? '').trim();
		const quantity = Number(input.quantity ?? 0);

		if (!orderId) throw new Error('orderId is required');
		if (!sku) throw new Error('sku is required');
		if (!Number.isFinite(quantity) || quantity <= 0) {
			throw new Error('quantity must be a positive number');
		}

		return new InventoryReservation(randomUUID(), orderId, sku, quantity);
	}

	static rehydrate(input: {
		uuid: string;
		orderId: string;
		sku: string;
		quantity: number;
	}): InventoryReservation {
		const uuid = String(input.uuid ?? '').trim();
		const orderId = String(input.orderId ?? '').trim();
		const sku = String(input.sku ?? '').trim();
		const quantity = Number(input.quantity ?? 0);

		if (!uuid) throw new Error('reservation uuid is required');
		if (!orderId) throw new Error('orderId is required');
		if (!sku) throw new Error('sku is required');
		if (!Number.isFinite(quantity) || quantity <= 0) {
			throw new Error('quantity must be a positive number');
		}

		return new InventoryReservation(uuid, orderId, sku, quantity);
	}

	get orderId(): string {
		return this._orderId;
	}

	get sku(): string {
		return this._sku;
	}

	get quantity(): number {
		return this._quantity;
	}

	toPrimitives(): {
		inventoryReservationId: string;
		orderId: string;
		sku: string;
		quantity: number;
	} {
		return {
			inventoryReservationId: this.id,
			orderId: this._orderId,
			sku: this._sku,
			quantity: this._quantity,
		};
	}
}
