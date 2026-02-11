import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  GetInventoryItemQuery,
  type InventoryItemView,
  ListInventoryItemsQuery,
  ListInventoryReservationsQuery,
  type InventoryReservationView,
} from '../../../shared/inventory';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('items')
  async listItems(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
    return this.queryBus.execute<InventoryItemView[]>(
      new ListInventoryItemsQuery(limit),
    );
  }

  @Get('items/:sku')
  async getItem(@Param('sku') sku: string) {
    return this.queryBus.execute<InventoryItemView | null>(
      new GetInventoryItemQuery(sku),
    );
  }

  @Get('reservations')
  async listReservations(@Query('orderId') orderId?: string) {
    const id = String(orderId ?? '');
    if (!id) return [];
    return this.queryBus.execute<InventoryReservationView[]>(
      new ListInventoryReservationsQuery(id),
    );
  }
}
