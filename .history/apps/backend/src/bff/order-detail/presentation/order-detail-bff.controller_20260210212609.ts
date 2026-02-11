import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetOrderDetailBffQuery } from '../application/queries/get-order-detail-bff.query';
import type { OrderDetailBffView } from '../application/queries/handlers/get-order-detail-bff.handler';
import { GetOrderDetailBffQueryDto } from './order-detail-bff.dto';

@Controller('bff/order-detail')
export class OrderDetailBffController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':orderId')
  async get(
    @Param('orderId') orderId: string,
    @Query() query: GetOrderDetailBffQueryDto,
  ) {
    const result = await this.queryBus.execute<
      GetOrderDetailBffQuery,
      OrderDetailBffView | null
    >(
      new GetOrderDetailBffQuery({
        orderId,
        includePayment: query.includePayment,
        includeShipment: query.includeShipment,
        includeReservations: query.includeReservations,
      }),
    );

    if (!result) throw new NotFoundException('order not found');
    return result;
  }
}
