import type { MoneyView } from '@/shared/money/money.view';

export type InventoryItemView = {
  itemId: string;
  sku: string;
  price: MoneyView;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
};
