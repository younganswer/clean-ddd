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

@Controller('bff/orders')
export class OrdersBffController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersBffQueryDto) {
    const limit = query.limit ?? 20;
    return this.queryBus.execute(new ListOrdersBffQuery({ limit }));
  }

  @Get(':orderId')
  async get(@Param('orderId') orderId: string) {
    const order = await this.queryBus.execute(
      new GetOrderBffQuery({ orderId }),
    );
    if (!order) throw new NotFoundException('order not found');
    return order;
  }

  @Post()
  async create(@Body() body: CreateOrderBffBodyDto) {
    return this.commandBus.execute(new CreateOrderBffCommand({ body }));
  }
}
