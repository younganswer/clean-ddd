import { BaseEntity } from '@/common/domain/base.entity';
import { INVENTORY_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';
import { randomUUID } from 'node:crypto';

export class InventoryItem extends BaseEntity {
	private constructor(
		id: string,
		private readonly _sku: string,
		private readonly _priceCurrency: string,
		private readonly _priceAmountMinor: number,
		private _availableQuantity: number,
		private _reservedQuantity: number,
	) {
		super(id);
	}

	static create(input: {
		sku: string;
		priceCurrency?: string;
		priceAmountMinor?: number;
		availableQuantity?: number;
		reservedQuantity?: number;
	}): InventoryItem {
		return new InventoryItem(
			randomUUID(),
			input.sku,
			input.priceCurrency ?? 'USD',
			input.priceAmountMinor ?? 100,
			input.availableQuantity ?? 0,
			input.reservedQuantity ?? 0,
		);
	}

	static rehydrate(input: {
		uuid: string;
		sku: string;
		priceCurrency: string;
		priceAmountMinor: number;
		availableQuantity: number;
		reservedQuantity: number;
	}): InventoryItem {
		return new InventoryItem(
			input.uuid,
			input.sku,
			input.priceCurrency,
			input.priceAmountMinor,
			input.availableQuantity,
			input.reservedQuantity,
		);
	}

	reserve(quantity: number): void {
		const normalized = Number(quantity ?? 0);
		if (!Number.isFinite(normalized) || normalized <= 0) {
			throw DomainErrorFactory.create(
				INVENTORY_DOMAIN_ERRORS.INVENTORY_QUANTITY_INVALID,
				{
					details: { quantity },
				},
			);
		}
		if (this._availableQuantity < normalized) {
			throw DomainErrorFactory.create(
				INVENTORY_DOMAIN_ERRORS.INVENTORY_STOCK_INSUFFICIENT,
				{
					message: `insufficient stock: sku=${this._sku} available=${this._availableQuantity} need=${normalized}`,
					details: {
						sku: this._sku,
						availableQuantity: this._availableQuantity,
						requestedQuantity: normalized,
					},
				},
			);
		}

		this._availableQuantity -= normalized;
		this._reservedQuantity += normalized;
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

	toPrimitives(): {
		inventoryItemId: string;
		sku: string;
		priceCurrency: string;
		priceAmountMinor: number;
		availableQuantity: number;
		reservedQuantity: number;
	} {
		return {
			inventoryItemId: this.id,
			sku: this._sku,
			priceCurrency: this._priceCurrency,
			priceAmountMinor: this._priceAmountMinor,
			availableQuantity: this._availableQuantity,
			reservedQuantity: this._reservedQuantity,
		};
	}
}
