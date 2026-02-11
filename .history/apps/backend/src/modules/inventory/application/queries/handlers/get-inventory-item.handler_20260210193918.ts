import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '../../../domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '../../../domains/repositories/i.inventory.repository';
import {
  GetInventoryItemQuery,
  type InventoryItemView,
} from '../../../../../shared/inventory';

@QueryHandler(GetInventoryItemQuery)
export class GetInventoryItemHandler implements IQueryHandler<GetInventoryItemQuery> {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    query: GetInventoryItemQuery,
  ): Promise<InventoryItemView | null> {
    await this.inventory.seedIfEmpty();
    const i = await this.inventory.findBySku(query.sku);
    if (!i) return null;

    return {
      sku: i.sku,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }
}
