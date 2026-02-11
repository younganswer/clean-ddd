import { Controller, Get, Param, Query } from '@nestjs/common';
import { InventoryRepository } from '../infrastructure/repositories/inventory.repository';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryRepository) {}

  @Get('items')
  async listItems(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
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

  @Get('items/:sku')
  async getItem(@Param('sku') sku: string) {
    await this.inventory.seedIfEmpty();
    const i = await this.inventory.findBySku(sku);
    if (!i) return null;
    return {
      sku: i.sku,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }

  @Get('reservations')
  async listReservations(@Query('orderId') orderId?: string) {
    const id = String(orderId ?? '');
    if (!id) return [];
    const rows = await this.inventory.findReservationsByOrderId(id);
    return rows.map((r) => ({
      reservationId: r.uuid,
      orderId: r.orderId,
      sku: r.sku,
      quantity: r.quantity,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
