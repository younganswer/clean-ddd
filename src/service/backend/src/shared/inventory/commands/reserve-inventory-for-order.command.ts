import type { InventoryOrderItemDto } from '@/shared/inventory/dto/inventory-order-item.dto';

export class ReserveInventoryForOrderCommand {
  constructor(
    public readonly input: {
      orderId: string;
      items: InventoryOrderItemDto[];
    },
  ) {}
}
