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
import { CreateOrderCommand } from '../../../shared/ordering/commands/create-order.command';
import { GetOrderQuery } from '../../../shared/ordering/queries/get-order.query';
import { ListOrdersQuery } from '../../../shared/ordering/queries/list-orders.query';
import type { PaginatedView } from '../../../shared/readers/paginated.view';
import type { OrderView } from '../../../shared/ordering/readers/order.view';
import { CreateOrderRequest } from './dto/create-order.request';

function isOrderView(value: unknown): value is OrderView {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.orderId === 'string' &&
    typeof record.amount === 'number' &&
    typeof record.currency === 'string'
  );
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderRequest): Promise<{ orderId: string }> {
    return await this.commandBus.execute(
      new CreateOrderCommand(body) as unknown as never,
    );
  }

  @Get()
  async list(
    @Query('limit') limitRaw?: string,
    @Query('page') pageRaw?: string,
  ): Promise<PaginatedView<OrderView>> {
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20') || 20));
    const page = Math.max(1, Number(pageRaw ?? '1') || 1);
    return await this.queryBus.execute(
      new ListOrdersQuery(limit, page) as unknown as never,
    );
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<OrderView> {
    const order = await this.queryBus.execute(
      new GetOrderQuery(id) as unknown as never,
    );
    if (!isOrderView(order)) throw new NotFoundException('order not found');
    return order;
  }
}
