import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShipmentRepository } from '../infrastructure/repositories/shipment.repository';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentRepository) {}

  @Get()
  async list(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);
    const rows = await this.shipments.findRecent(limit);
    return rows.map((s) => ({
      shipmentId: s.uuid,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  @Get('by-order/:orderId')
  async byOrder(@Param('orderId') orderId: string) {
    const s = await this.shipments.findByOrderId(orderId);
    if (!s) return null;
    return {
      shipmentId: s.uuid,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const s = await this.shipments.findById(id);
    if (!s) return null;
    return {
      shipmentId: s.uuid,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
