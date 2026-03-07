import { Query } from '@nestjs/cqrs';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetShipmentByOrderQuery extends Query<ShipmentResult | null> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
		);
	}
}
