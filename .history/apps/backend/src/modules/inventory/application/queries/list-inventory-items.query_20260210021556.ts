import { Query } from '@nestjs/cqrs';
import type { InventoryItemView } from './inventory-item.view';

export class ListInventoryItemsQuery extends Query<InventoryItemView[]> {
  constructor(public readonly limit: number) {
    super();
  }
}
