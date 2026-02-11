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
    return (await this.queryBus.execute(
      new ListShipmentsQuery(limit) as unknown as never,
    )) as ShipmentView[];
  }

  @Get('by-order/:orderId')
  async byOrder(@Param('orderId') orderId: string) {
    return (await this.queryBus.execute(
      new GetShipmentByOrderQuery(orderId) as unknown as never,
    )) as ShipmentView | null;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return (await this.queryBus.execute(
      new GetShipmentQuery(id) as unknown as never,
    )) as ShipmentView | null;
  }
}
