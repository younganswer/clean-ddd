import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderCommand } from '@/shared/shipping';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ShipmentCreationDomainService } from '@/modules/shipping/domains/services/shipment-creation.domain-service';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
	constructor(
		private readonly shipmentCreationDomainService: ShipmentCreationDomainService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreateShipmentForOrderCommand,
	): Promise<{ shipmentId: string }> {
		return await this.uow.transaction(async () => {
			const shipment =
				await this.shipmentCreationDomainService.createIdempotent(
					command.orderId,
				);

			return { shipmentId: shipment.id };
		});
	}
}
