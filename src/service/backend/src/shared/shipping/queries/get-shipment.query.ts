import { Query } from '@nestjs/cqrs';
import type { ShipmentResult } from '@/shared/shipping/readers/dto/shipment.result';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetShipmentQuery extends Query<ShipmentResult | null> {
	public readonly shipmentId: string;

	constructor(input: { shipmentId: string }) {
		super();
		this.shipmentId = requireTrimmedString(
			input.shipmentId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
			{ reason: 'shipmentId' },
		);
	}
}
