import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
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

  @Get(':id')
  async get(@Param('id') id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('order not found');
    return {
      orderId: order.uuid,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
