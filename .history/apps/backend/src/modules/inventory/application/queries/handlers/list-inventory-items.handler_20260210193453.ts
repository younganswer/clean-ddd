import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '../../../domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '../../../domains/repositories/i.inventory.repository';
import {
  ListInventoryItemsQuery,
  type InventoryItemView,
} from '../../../../../shared/inventory';

@QueryHandler(ListInventoryItemsQuery)
export class ListInventoryItemsHandler implements IQueryHandler<ListInventoryItemsQuery> {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(query: ListInventoryItemsQuery): Promise<InventoryItemView[]> {
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 50)));
    await this.inventory.seedIfEmpty();
    const rows = await this.inventory.findAll(limit);

    return rows.map((i) => ({
      sku: i.sku,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
  }
}
