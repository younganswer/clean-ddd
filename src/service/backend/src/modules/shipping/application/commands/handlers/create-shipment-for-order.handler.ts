import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ShipmentCreationService } from '@/modules/shipping/domains/services/shipment-creation.service';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
	constructor(
		private readonly ShipmentCreationService: ShipmentCreationService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreateShipmentForOrderCommand,
	): Promise<{ shipmentId: string }> {
		return await this.uow.transaction(async () => {
			const shipment =
				await this.ShipmentCreationService.createIdempotent(
					command.orderId,
				);

			return { shipmentId: shipment.id };
		});
	}
}
