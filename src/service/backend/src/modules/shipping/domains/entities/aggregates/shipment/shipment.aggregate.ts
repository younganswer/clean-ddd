import { ShipmentStatus } from '@/shared/shipping';
import { BaseEntity } from '@/shared/domain/base.entity';

export class Shipment extends BaseEntity<string> {
  private constructor(
    id: string,
    private readonly _orderId: string,
    private _status: ShipmentStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id, id);
  }

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
      shipmentId: this.id,
      orderId: this._orderId,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
