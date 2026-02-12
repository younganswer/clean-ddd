import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '../../../domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '../../../domains/repositories/i.inventory.repository';
import {
  ListInventoryItemsQuery,
  type InventoryItemView,
} from '../../../../../shared/inventory';
import type { PaginatedView } from '../../../../../shared/readers/paginated.view';

@QueryHandler(ListInventoryItemsQuery)
export class ListInventoryItemsHandler implements IQueryHandler<ListInventoryItemsQuery> {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    query: ListInventoryItemsQuery,
  ): Promise<PaginatedView<InventoryItemView>> {
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 50) || 50));
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const offset = (page - 1) * limit;
    await this.inventory.seedIfEmpty();
    const [rows, total] = await Promise.all([
      this.inventory.findAll(limit, offset),
      this.inventory.countItems(),
    ]);

    const items = rows.map((i) => ({
      sku: i.sku,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      page,
      limit,
      total,
      totalPages,
      hasNext: offset + items.length < total,
    };
  }
}
