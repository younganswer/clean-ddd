import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderCommand } from '@/shared/shipping';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ShipmentCreationDomainService } from '@/modules/shipping/domains/services/shipment-creation.domain-service';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
	constructor(
		private readonly shipmentCreationDomainService: ShipmentCreationDomainService,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreateShipmentForOrderCommand,
	): Promise<{ shipmentId: string }> {
		const orderId = String(command.orderId ?? '').trim();
		if (!orderId) {
			throw ApplicationErrorFactory.create(
				SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
			);
		}

		return await this.uow.transaction(async () => {
			const shipment =
				await this.shipmentCreationDomainService.createForOrderIdempotent(
					orderId,
				);

			return { shipmentId: shipment.id };
		});
	}
}
