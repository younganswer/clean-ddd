import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IOrderRepositorySymbol,
  type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';

@CommandHandler(MarkOrderPaidCommand)
export class MarkOrderPaidHandler implements ICommandHandler<MarkOrderPaidCommand> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
  ) {}

  async execute(command: MarkOrderPaidCommand): Promise<void> {
    const orderId = String(command.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    await this.orders.markPaid(orderId);
  }
}
