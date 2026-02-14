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
import { executeCommand, executeQuery } from 'src/common/utils/cqrs-executor';
import { CreateOrderCommand } from '../../../shared/ordering/commands/create-order.command';
import { GetOrderQuery } from '../../../shared/ordering/queries/get-order.query';
import { ListOrdersQuery } from '../../../shared/ordering/queries/list-orders.query';
import type { PaginatedView } from '../../../shared/readers/paginated.view';
import type { OrderView } from '../../../shared/ordering/readers/order.view';
import { isOrderView } from '../../../shared/ordering/readers/order-view.guard';
import { CreateOrderRequest } from './dto/create-order.request';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderRequest): Promise<{ orderId: string }> {
    return await executeCommand(this.commandBus, new CreateOrderCommand(body));
  }

  @Get()
  async list(
    @Query('limit') limitRaw?: string,
    @Query('page') pageRaw?: string,
  ): Promise<PaginatedView<OrderView>> {
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20') || 20));
    const page = Math.max(1, Number(pageRaw ?? '1') || 1);
    return await executeQuery(this.queryBus, new ListOrdersQuery(limit, page));
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<OrderView> {
    const order = await executeQuery(this.queryBus, new GetOrderQuery(id));
    if (!isOrderView(order)) throw new NotFoundException('order not found');
    return order;
  }
}
