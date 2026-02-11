import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../application/commands/create-order.command';
import { OrderRepository } from '../infrastructure/repositories/order.repository';
import { CreateOrderRequest } from './dto/create-order.request';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly orders: OrderRepository,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderRequest) {
    return this.commandBus.execute(new CreateOrderCommand(body));
  }

  @Get()
  async list(@Query('limit') limitRaw?: string) {
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20')));
    const orders = await this.orders.findRecent(limit);
    return orders.map((o) => ({
      orderId: o.uuid,
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      items: o.items,
      paymentId: o.paymentId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('order not found');
    return {
      orderId: order.uuid,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      items: order.items,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
