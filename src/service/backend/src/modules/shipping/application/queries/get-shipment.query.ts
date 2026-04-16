import { Query } from '@nestjs/cqrs';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import { ShippingOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetShipmentQuery extends Query<ShipmentResult | null> {
	public readonly shipmentId: string;

	constructor(input: { shipmentId: string }) {
		super();
		const shipmentId = toTrimmedString(input.shipmentId);
		if (!shipmentId) {
			throw ApplicationExceptionFactory.create(
				ShippingOrderIdRequiredException,
				{ description: 'shipmentId' },
			);
		}

		this.shipmentId = shipmentId;
	}
}
