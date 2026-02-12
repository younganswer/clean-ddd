import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  GetShipmentByOrderQuery,
  GetShipmentQuery,
  ListShipmentsQuery,
  type ShipmentView,
} from '../../../shared/shipping';
import type { PaginatedView } from '../../../shared/readers/paginated.view';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(
    @Query('limit') limitRaw?: string,
    @Query('page') pageRaw?: string,
  ): Promise<PaginatedView<ShipmentView>> {
    const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    return await this.queryBus.execute(
      new ListShipmentsQuery(limit, page) as unknown as never,
    );
  }

  @Get('by-order/:orderId')
  async byOrder(
    @Param('orderId') orderId: string,
  ): Promise<ShipmentView | null> {
    return await this.queryBus.execute(
      new GetShipmentByOrderQuery(orderId) as unknown as never,
    );
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ShipmentView | null> {
    return await this.queryBus.execute(
      new GetShipmentQuery(id) as unknown as never,
    );
  }
}
