import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IOrderRepositorySymbol,
  type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';

@CommandHandler(AttachPaymentToOrderCommand)
export class AttachPaymentToOrderHandler implements ICommandHandler<AttachPaymentToOrderCommand> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: AttachPaymentToOrderCommand): Promise<void> {
    const orderId = String(command.input.orderId ?? '').trim();
    const paymentId = String(command.input.paymentId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');
    if (!paymentId) throw new Error('paymentId is required');

    await this.em.transactional(async (tx) =>
      RequestContext.create(tx, async () => {
        await this.orders.attachPayment(orderId, paymentId);
        await tx.flush();
      }),
    );
  }
}
