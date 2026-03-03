import { Inject, Injectable } from '@nestjs/common';
import {
	IShipmentRepositorySymbol,
	type IShipmentRepository,
} from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';
import { SHIPPING_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';

@Injectable()
export class ShipmentCreationDomainService {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async createIdempotent(orderId: string): Promise<Shipment> {
		const normalizedOrderId = String(orderId ?? '').trim();
		if (!normalizedOrderId) {
			throw DomainErrorFactory.create(
				SHIPPING_DOMAIN_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
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
