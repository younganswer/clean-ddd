import { Command } from '@nestjs/cqrs';
import type { InventoryOrderItem } from '../../domains/inventory-item';

export class ReserveInventoryForOrderCommand extends Command<void> {
  constructor(
    public readonly input: {
      orderId: string;
      items: InventoryOrderItem[];
    },
  ) {
    super();
  }
}
