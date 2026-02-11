import { Query } from '@nestjs/cqrs';
import type { InventoryItemView } from './inventory-item.view';

export class GetInventoryItemQuery extends Query<InventoryItemView | null> {
  constructor(public readonly sku: string) {
    super();
  }
}
