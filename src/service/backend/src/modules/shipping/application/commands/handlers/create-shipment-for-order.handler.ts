import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ShipmentCreationService } from '@/modules/shipping/domains/services/shipment-creation.service';
import { LogAsyncExecution } from '@/common/logging/log-async-execution.decorator';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
	constructor(
		private readonly ShipmentCreationService: ShipmentCreationService,
		private readonly uow: UnitOfWork,
	) {}

	@LogAsyncExecution<[CreateShipmentForOrderCommand], { shipmentId: string }>(
		{
			completed: {
				step: 'create_shipment_for_order_completed',
				durationFieldName: 'handlerTotalMs',
				getPayload: ([command], result) => ({
					orderId: command.orderId,
					shipmentId: result.shipmentId,
				}),
			},
		},
	)
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
