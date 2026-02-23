import { BaseEntity } from '@/shared/domain/base.entity';

export class InventoryReservation extends BaseEntity {
	private constructor(
		id: number,
		uuid: string,
		private readonly _orderId: string,
		private readonly _sku: string,
		private readonly _quantity: number,
		private readonly _createdAt: Date,
	) {
		super(id, uuid);
	}

	static rehydrate(input: {
		id: number;
		uuid: string;
		orderId: string;
		sku: string;
		quantity: number;
		createdAt: Date;
	}): InventoryReservation {
		return new InventoryReservation(
			input.id,
			input.uuid,
			input.orderId,
			input.sku,
			input.quantity,
			input.createdAt,
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

	get createdAt(): Date {
		return this._createdAt;
	}

	toPrimitives(): {
		reservationId: string;
		orderId: string;
		sku: string;
		quantity: number;
		createdAt: Date;
	} {
		return {
			reservationId: this.uuid,
			orderId: this._orderId,
			sku: this._sku,
			quantity: this._quantity,
			createdAt: this._createdAt,
		};
	}
}
