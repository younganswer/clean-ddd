import type { MoneyResult } from '@/shared/money/money.result';

export type InventoryItemResult = {
	itemId: string;
	sku: string;
	price: MoneyResult;
	availableQuantity: number;
	reservedQuantity: number;
};
