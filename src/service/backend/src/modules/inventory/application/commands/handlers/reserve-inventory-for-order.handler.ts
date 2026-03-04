import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationDomainService } from '@/modules/inventory/domains/services/inventory-reservation.domain-service';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationDomainService)
		private readonly inventoryReservationDomainService: InventoryReservationDomainService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		await this.uow.transaction(async () => {
			await this.inventoryReservationDomainService.reserve({
				orderId: command.input.orderId,
				items: command.input.items,
			});
		});
	}
}
