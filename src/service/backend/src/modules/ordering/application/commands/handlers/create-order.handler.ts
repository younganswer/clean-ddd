import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
  ) {}

  async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
    const order = await this.orders.create({
      ...command.input,
    });
    return { orderId: order.uuid };
  }
}
