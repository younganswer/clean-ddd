import { BaseEntity } from '@/common/domain/base.entity';
import {
	InventoryReservationIdRequiredException,
	InventoryReservationOrderIdRequiredException,
	InventoryReservationQuantityInvalidException,
	InventoryReservationSkuRequiredException,
} from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';
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

		if (!orderId) {
			throw DomainExceptionFactory.create(
				InventoryReservationOrderIdRequiredException,
			);
		}
		if (!sku) {
			throw DomainExceptionFactory.create(
				InventoryReservationSkuRequiredException,
			);
		}
		if (!Number.isFinite(quantity) || quantity <= 0) {
			throw DomainExceptionFactory.create(
				InventoryReservationQuantityInvalidException,
				{
					cause: { quantity: input.quantity },
				},
			);
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

		if (!uuid) {
			throw DomainExceptionFactory.create(
				InventoryReservationIdRequiredException,
			);
		}
		if (!orderId) {
			throw DomainExceptionFactory.create(
				InventoryReservationOrderIdRequiredException,
			);
		}
		if (!sku) {
			throw DomainExceptionFactory.create(
				InventoryReservationSkuRequiredException,
			);
		}
		if (!Number.isFinite(quantity) || quantity <= 0) {
			throw DomainExceptionFactory.create(
				InventoryReservationQuantityInvalidException,
				{
					cause: { quantity: input.quantity },
				},
			);
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
