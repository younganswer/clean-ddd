import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  GetShipmentByOrderQuery,
  GetShipmentQuery,
  ListShipmentsQuery,
  type ShipmentView,
} from '../../../shared/shipping';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);
    return this.queryBus.execute<ShipmentView[]>(new ListShipmentsQuery(limit));
  }

  @Get('by-order/:orderId')
  async byOrder(@Param('orderId') orderId: string) {
    return this.queryBus.execute<ShipmentView | null>(
      new GetShipmentByOrderQuery(orderId),
    );
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.queryBus.execute<ShipmentView | null>(new GetShipmentQuery(id));
  }
}
