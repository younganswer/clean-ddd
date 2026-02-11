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
import type { OrderView } from '../../../shared/readers/ordering/dto/order.view';

@Controller('bff/orders')
export class OrdersBffController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersBffQueryDto): Promise<OrderView[]> {
    const limit = query.limit ?? 20;
    const res = await this.queryBus.execute(
      new ListOrdersBffQuery({ limit }) as unknown as never,
    );
    return res as unknown as OrderView[];
  }

  @Get(':orderId')
  async get(@Param('orderId') orderId: string): Promise<OrderView> {
    const order = (await this.queryBus.execute(
      new GetOrderBffQuery({ orderId }) as unknown as never,
    )) as unknown as OrderView | null;
    if (!order) throw new NotFoundException('order not found');
    return order;
  }

  @Post()
  async create(
    @Body() body: CreateOrderBffBodyDto,
  ): Promise<{ orderId: string }> {
    const res = await this.commandBus.execute(
      new CreateOrderBffCommand({ body }) as unknown as never,
    );
    return res as unknown as { orderId: string };
  }
}
