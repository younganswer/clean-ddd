export class InventoryItem {
  private constructor(
    private readonly _sku: string,
    private _availableQuantity: number,
    private _reservedQuantity: number,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static rehydrate(input: {
    sku: string;
    availableQuantity: number;
    reservedQuantity: number;
    createdAt: Date;
    updatedAt: Date;
  }): InventoryItem {
    return new InventoryItem(
      input.sku,
      input.availableQuantity,
      input.reservedQuantity,
      input.createdAt,
      input.updatedAt,
    );
  }

  get sku(): string {
    return this._sku;
  }

  get availableQuantity(): number {
    return this._availableQuantity;
  }

  get reservedQuantity(): number {
    return this._reservedQuantity;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): {
    sku: string;
    availableQuantity: number;
    reservedQuantity: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      sku: this._sku,
      availableQuantity: this._availableQuantity,
      reservedQuantity: this._reservedQuantity,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
