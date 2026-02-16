import { ShipmentStatus } from '@/shared/shipping';
import { BaseEntity } from '@/shared/domain/base.entity';

export class Shipment extends BaseEntity {
  private constructor(
    id: number,
    uuid: string,
    private readonly _orderId: string,
    private _status: ShipmentStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id, uuid);
  }

  static createForOrder(input: {
    id: number;
    uuid: string;
    orderId: string;
    now?: Date;
  }): Shipment {
    const now = input.now ?? new Date();
    return new Shipment(
      input.id,
      input.uuid,
      input.orderId,
      ShipmentStatus.PENDING,
      now,
      now,
    );
  }

  static rehydrate(input: {
    id: number;
    uuid: string;
    orderId: string;
    status: ShipmentStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Shipment {
    return new Shipment(
      input.id,
      input.uuid,
      input.orderId,
      input.status,
      input.createdAt,
      input.updatedAt,
    );
  }

  get orderId(): string {
    return this._orderId;
  }

  get status(): ShipmentStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): {
    shipmentId: string;
    orderId: string;
    status: ShipmentStatus;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      shipmentId: this.uuid,
      orderId: this._orderId,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
