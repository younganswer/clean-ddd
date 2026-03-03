import { Command } from '@nestjs/cqrs';
import type { InventoryOrderItemDto } from '@/shared/inventory/dto/inventory-order-item.dto';

export class ReserveInventoryForOrderCommand extends Command<void> {
	constructor(
		public readonly input: {
			orderId: string;
			items: InventoryOrderItemDto[];
		},
	) {
		super();
	}
}
