import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateOrderBffBodyDto, ListOrdersBffQueryDto } from './orders-bff.dto';
import { CreateOrderBffCommand } from '../application/commands/create-order-bff.command';
import { GetOrderBffQuery } from '../application/queries/get-order-bff.query';
import { ListOrdersBffQuery } from '../application/queries/list-orders-bff.query';
import type { OrderView } from '../../../shared/ordering/readers/order.view';

@Controller('bff/orders')
export class OrdersBffController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersBffQueryDto): Promise<OrderView[]> {
    const limit = query.limit ?? 20;
    return await this.queryBus.execute<ListOrdersBffQuery, OrderView[]>(
      new ListOrdersBffQuery({ limit }),
    );
  }

  @Get(':orderId')
  async get(@Param('orderId') orderId: string): Promise<OrderView> {
    const order = await this.queryBus.execute<
      GetOrderBffQuery,
      OrderView | null
    >(new GetOrderBffQuery({ orderId }));
    if (!order) throw new NotFoundException('order not found');
    return order;
  }

  @Post()
  async create(
    @Body() body: CreateOrderBffBodyDto,
  ): Promise<{ orderId: string }> {
    return await this.commandBus.execute<
      CreateOrderBffCommand,
      { orderId: string }
    >(new CreateOrderBffCommand({ body }));
  }
}
