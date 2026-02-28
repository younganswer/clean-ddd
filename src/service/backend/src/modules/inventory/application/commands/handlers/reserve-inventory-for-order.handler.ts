import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationDomainService } from '@/modules/inventory/domains/services/inventory-reservation.domain-service';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationDomainService)
		private readonly reservationDomainService: InventoryReservationDomainService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');

		await this.uow.transaction(async () => {
			await this.reservationDomainService.reserveForOrder({
				orderId,
				items: command.input.items ?? [],
			});
		});
	}
}
