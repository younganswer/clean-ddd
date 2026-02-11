import { ShipmentStatus } from '../../../shipment-status';

export class Shipment {
  private constructor(
    private readonly _id: string,
    private readonly _orderId: string,
    private _status: ShipmentStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static createForOrder(input: {
    id: string;
    orderId: string;
    now?: Date;
  }): Shipment {
    const now = input.now ?? new Date();
    return new Shipment(
      input.id,
      input.orderId,
      ShipmentStatus.PENDING,
      now,
      now,
    );
  }

  static rehydrate(input: {
    id: string;
    orderId: string;
    status: ShipmentStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Shipment {
    return new Shipment(
      input.id,
      input.orderId,
      input.status,
      input.createdAt,
      input.updatedAt,
    );
  }

  get id(): string {
    return this._id;
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
      shipmentId: this._id,
      orderId: this._orderId,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
