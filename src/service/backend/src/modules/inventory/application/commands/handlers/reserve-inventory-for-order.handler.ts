import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationService } from '@/modules/inventory/domain/services/inventory-reservation.service';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationService)
		private readonly InventoryReservationService: InventoryReservationService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		await this.uow.transaction(async () => {
			await this.InventoryReservationService.reserve(command);
		});
	}
}
