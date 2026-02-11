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
    return (await this.queryBus.execute(
      new ListInventoryItemsQuery(limit) as unknown as never,
    )) as InventoryItemView[];
  }

  @Get('items/:sku')
  async getItem(@Param('sku') sku: string) {
    return (await this.queryBus.execute(
      new GetInventoryItemQuery(sku) as unknown as never,
    )) as InventoryItemView | null;
  }

  @Get('reservations')
  async listReservations(@Query('orderId') orderId?: string) {
    const id = String(orderId ?? '');
    if (!id) return [];
    return (await this.queryBus.execute(
      new ListInventoryReservationsQuery(id) as unknown as never,
    )) as InventoryReservationView[];
  }
}
