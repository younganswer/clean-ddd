import type { InventoryOrderItemDto } from '../dto/inventory-order-item.dto';

export class ReserveInventoryForOrderCommand {
  constructor(
    public readonly input: {
      orderId: string;
      items: InventoryOrderItemDto[];
    },
  ) {}
}
