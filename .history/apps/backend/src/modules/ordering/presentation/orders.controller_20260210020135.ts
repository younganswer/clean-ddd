import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../application/commands/create-order.command';
import { GetOrderQuery } from '../application/queries/get-order.query';
import { ListOrdersQuery } from '../application/queries/list-orders.query';
import { CreateOrderRequest } from './dto/create-order.request';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderRequest) {
    return this.commandBus.execute(new CreateOrderCommand(body));
  }

  @Get()
  async list(@Query('limit') limitRaw?: string) {
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20')));
    return this.queryBus.execute(new ListOrdersQuery(limit));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const order = await this.queryBus.execute(new GetOrderQuery(id));
    if (!order) throw new NotFoundException('order not found');
    return order;
  }
}
