import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { InventoryReservationService } from '@/modules/inventory/domains/services/inventory-reservation.service';
import { LogAsyncExecution } from '@/common/logging/log-async-execution.decorator';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(InventoryReservationService)
		private readonly InventoryReservationService: InventoryReservationService,
		private readonly uow: UnitOfWork,
	) {}

	@LogAsyncExecution<[ReserveInventoryForOrderCommand], void>({
		completed: {
			step: 'reserve_inventory_for_order_completed',
			durationFieldName: 'handlerTotalMs',
			getPayload: ([command]) => ({
				orderId: command.orderId,
				itemCount: command.items.length,
			}),
		},
	})
	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		await this.uow.transaction(async () => {
			await this.InventoryReservationService.reserve(command);
		});
	}
}
