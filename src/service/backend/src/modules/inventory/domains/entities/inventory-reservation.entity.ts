export class InventoryReservation {
  private constructor(
    private readonly _id: string,
    private readonly _orderId: string,
    private readonly _sku: string,
    private readonly _quantity: number,
    private readonly _createdAt: Date,
  ) {}

  static rehydrate(input: {
    id: string;
    orderId: string;
    sku: string;
    quantity: number;
    createdAt: Date;
  }): InventoryReservation {
    return new InventoryReservation(
      input.id,
      input.orderId,
      input.sku,
      input.quantity,
      input.createdAt,
    );
  }

  get id(): string {
    return this._id;
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
      reservationId: this._id,
      orderId: this._orderId,
      sku: this._sku,
      quantity: this._quantity,
      createdAt: this._createdAt,
    };
  }
}
