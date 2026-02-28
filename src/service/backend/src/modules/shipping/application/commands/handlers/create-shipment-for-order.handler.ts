import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { CreateShipmentForOrderCommand } from '@/shared/shipping';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';

@CommandHandler(CreateShipmentForOrderCommand)
export class CreateShipmentForOrderHandler implements ICommandHandler<CreateShipmentForOrderCommand> {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipments: IShipmentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreateShipmentForOrderCommand,
	): Promise<{ shipmentId: string }> {
		const orderId = String(command.orderId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');

		return await this.uow.transaction(async () => {
			const existing = await this.shipments.findByOrderId(orderId);
			if (existing) {
				return { shipmentId: existing.uuid };
			}

			const shipment = Shipment.createForOrder({ orderId });
			await this.shipments.persist(shipment);

			return { shipmentId: shipment.uuid };
		});
	}
}
