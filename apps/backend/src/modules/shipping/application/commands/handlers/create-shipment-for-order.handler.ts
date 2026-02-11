import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '../../../domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '../../../domains/repositories/i.shipment.repository';
import { CreateShipmentForOrderCommand } from '../../../../../shared/shipping';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async execute(
    command: CreateShipmentForOrderCommand,
  ): Promise<{ shipmentId: string }> {
    const orderId = String(command.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    const shipment = await this.shipments.createForOrder(orderId);
    return { shipmentId: shipment.id };
  }
}
