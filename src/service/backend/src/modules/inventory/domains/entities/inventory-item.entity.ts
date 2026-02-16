import { BaseEntity } from '@/shared/domain/base.entity';

export class InventoryItem extends BaseEntity {
  private constructor(
    id: number,
    uuid: string,
    private readonly _sku: string,
    private readonly _priceCurrency: string,
    private readonly _priceAmountMinor: number,
    private _availableQuantity: number,
    private _reservedQuantity: number,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id, uuid);
  }

  static rehydrate(input: {
    id: number;
    uuid: string;
    sku: string;
    priceCurrency: string;
    priceAmountMinor: number;
    availableQuantity: number;
    reservedQuantity: number;
    createdAt: Date;
    updatedAt: Date;
  }): InventoryItem {
    return new InventoryItem(
      input.id,
      input.uuid,
      input.sku,
      input.priceCurrency,
      input.priceAmountMinor,
      input.availableQuantity,
      input.reservedQuantity,
      input.createdAt,
      input.updatedAt,
    );
  }

  get sku(): string {
    return this._sku;
  }

  get priceCurrency(): string {
    return this._priceCurrency;
  }

  get priceAmountMinor(): number {
    return this._priceAmountMinor;
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
    id: number;
    uuid: string;
    sku: string;
    priceCurrency: string;
    priceAmountMinor: number;
    availableQuantity: number;
    reservedQuantity: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      uuid: this.uuid,
      sku: this._sku,
      priceCurrency: this._priceCurrency,
      priceAmountMinor: this._priceAmountMinor,
      availableQuantity: this._availableQuantity,
      reservedQuantity: this._reservedQuantity,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
