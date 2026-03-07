import type { MoneyResult } from '@/shared/money/money.result';

type InventoryItemSchema = {
	uuid: string;
	sku: string;
	priceCurrency: string;
	priceAmountMinor: number;
	availableQuantity: number;
	reservedQuantity: number;
};

export class InventoryItemResult {
	constructor(
		public readonly itemId: string,
		public readonly sku: string,
		public readonly price: MoneyResult,
		public readonly availableQuantity: number,
		public readonly reservedQuantity: number,
	) {}

	static fromSchema(schema: InventoryItemSchema): InventoryItemResult {
		return new InventoryItemResult(
			schema.uuid,
			schema.sku,
			{
				currency: schema.priceCurrency,
				amountMinor: schema.priceAmountMinor,
			},
			schema.availableQuantity,
			schema.reservedQuantity,
		);
	}
}
