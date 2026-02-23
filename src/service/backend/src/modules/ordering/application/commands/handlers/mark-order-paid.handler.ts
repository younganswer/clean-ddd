import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
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
    private readonly em: EntityManager,
  ) {}

  async execute(command: MarkOrderPaidCommand): Promise<void> {
    const orderId = String(command.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    await this.em.transactional(async (tx) =>
      RequestContext.create(tx, async () => {
        await this.orders.markPaid(orderId);
        await tx.flush();
      }),
    );
  }
}
