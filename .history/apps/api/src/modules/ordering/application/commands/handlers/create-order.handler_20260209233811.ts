import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../create-order.command';
import { OrderRepository } from '../../../ordering/infrastructure/repositories/order.repository';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(private readonly orders: OrderRepository) {}

  async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
    const order = await this.orders.create(command.input);
    return { orderId: order.uuid };
  }
}
