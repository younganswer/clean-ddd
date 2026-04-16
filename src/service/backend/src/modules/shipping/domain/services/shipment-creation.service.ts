import { Inject, Injectable } from '@nestjs/common';
import {
	IShipmentRepositorySymbol,
	type IShipmentRepository,
} from '@/modules/shipping/domain/repositories/i.shipment.repository';
import { Shipment } from '@/modules/shipping/domain/entities/aggregates/shipment/shipment.aggregate';
import { ShippingOrderIdRequiredException } from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';

@Injectable()
export class ShipmentCreationService {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async createIdempotent(orderId: string): Promise<Shipment> {
		const normalizedOrderId = String(orderId ?? '').trim();
		if (!normalizedOrderId) {
			throw DomainExceptionFactory.create(
				ShippingOrderIdRequiredException,
			);
		}

		const existing =
			await this.shipmentRepository.findByOrderId(normalizedOrderId);
		if (existing) {
			return existing;
		}

		const shipment = Shipment.create({
			orderId: normalizedOrderId,
		});
		await this.shipmentRepository.persist(shipment);

		return shipment;
	}
}
