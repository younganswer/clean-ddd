import { Inject, Injectable } from '@nestjs/common';
import {
	IShipmentRepositorySymbol,
	type IShipmentRepository,
} from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';

@Injectable()
export class ShipmentCreationDomainService {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async createForOrderIdempotent(orderId: string): Promise<Shipment> {
		const normalizedOrderId = String(orderId ?? '').trim();
		if (!normalizedOrderId) {
			throw new Error('orderId is required');
		}

		const existing =
			await this.shipmentRepository.findByOrderId(normalizedOrderId);
		if (existing) {
			return existing;
		}

		const shipment = Shipment.createForOrder({
			orderId: normalizedOrderId,
		});
		await this.shipmentRepository.persist(shipment);

		return shipment;
	}
}
