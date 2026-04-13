import { Query } from '@nestjs/cqrs';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import { ShippingOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetShipmentByOrderQuery extends Query<ShipmentResult | null> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				ShippingOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
	}
}
