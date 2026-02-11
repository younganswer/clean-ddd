import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '../../../domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '../../../domains/repositories/i.inventory.repository';
import { ReserveInventoryForOrderCommand } from '../reserve-inventory-for-order.command';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
    const orderId = String(command.input.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    await this.inventory.seedIfEmpty();
    await this.inventory.reserveForOrder(orderId, command.input.items ?? []);
  }
}
