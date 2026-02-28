import { BaseEntity } from '@/shared/domain/base.entity';
import { randomUUID } from 'node:crypto';

export class InventoryReservation extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _orderId: string,
		private readonly _sku: string,
		private readonly _quantity: number,
	) {
		super(uuid);
	}

	static create(input: {
		orderId: string;
		sku: string;
		quantity: number;
	}): InventoryReservation {
		return new InventoryReservation(
			randomUUID(),
			input.orderId,
			input.sku,
			input.quantity,
		);
	}

	static rehydrate(input: {
		uuid: string;
		orderId: string;
		sku: string;
		quantity: number;
	}): InventoryReservation {
		return new InventoryReservation(
			input.uuid,
			input.orderId,
			input.sku,
			input.quantity,
		);
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
		reservationId: string;
		orderId: string;
		sku: string;
		quantity: number;
	} {
		return {
			reservationId: this.uuid,
			orderId: this._orderId,
			sku: this._sku,
			quantity: this._quantity,
		};
	}
}
