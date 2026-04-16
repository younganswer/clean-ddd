import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationService } from '@/modules/inventory/domain/services/inventory-reservation.service';
import { ReleaseInventoryForOrderCommand } from '@/modules/inventory/application/commands/release-inventory-for-order.command';

@CommandHandler(ReleaseInventoryForOrderCommand)
export class ReleaseInventoryForOrderHandler implements ICommandHandler<ReleaseInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationService)
		private readonly inventoryReservationService: InventoryReservationService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReleaseInventoryForOrderCommand): Promise<void> {
		await this.uow.transaction(async () => {
			await this.inventoryReservationService.releaseForOrder({
				orderId: command.orderId,
			});
		});
	}
}
