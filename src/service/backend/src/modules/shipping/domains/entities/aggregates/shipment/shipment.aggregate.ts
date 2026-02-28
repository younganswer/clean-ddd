import { ShipmentStatus } from '@/shared/shipping';
import { BaseEntity } from '@/shared/domain/base.entity';
import { randomUUID } from 'node:crypto';

export class Shipment extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _orderId: string,
		private _status: ShipmentStatus,
	) {
		super(uuid);
	}

	static createForOrder(input: { orderId: string; now?: Date }): Shipment {
		return new Shipment(
			randomUUID(),
			input.orderId,
			ShipmentStatus.PENDING,
		);
	}

	static rehydrate(input: {
		uuid: string;
		orderId: string;
		status: ShipmentStatus;
	}): Shipment {
		return new Shipment(input.uuid, input.orderId, input.status);
	}

	get orderId(): string {
		return this._orderId;
	}

	get status(): ShipmentStatus {
		return this._status;
	}

	toPrimitives(): {
		shipmentId: string;
		orderId: string;
		status: ShipmentStatus;
	} {
		return {
			shipmentId: this.uuid,
			orderId: this._orderId,
			status: this._status,
		};
	}
}
