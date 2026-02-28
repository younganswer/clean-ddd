import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationDomainService } from '@/modules/inventory/domains/services/inventory-reservation.domain-service';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationDomainService)
		private readonly inventoryReservationDomainService: InventoryReservationDomainService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		if (!orderId) {
			throw ApplicationErrorFactory.create(
				INVENTORY_APPLICATION_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
			);
		}

		await this.uow.transaction(async () => {
			await this.inventoryReservationDomainService.reserveForOrder({
				orderId,
				items: command.input.items ?? [],
			});
		});
	}
}
