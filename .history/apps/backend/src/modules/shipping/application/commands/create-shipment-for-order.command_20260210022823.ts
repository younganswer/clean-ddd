import { Command } from '@nestjs/cqrs';

export class CreateShipmentForOrderCommand extends Command<{ shipmentId: string }> {
  constructor(public readonly orderId: string) {
    super();
  }
}
