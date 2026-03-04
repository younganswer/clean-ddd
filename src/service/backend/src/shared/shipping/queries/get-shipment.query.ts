import { Query } from '@nestjs/cqrs';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetShipmentQuery extends Query<ShipmentView | null> {
	public readonly shipmentId: string;

	constructor(shipmentId: string) {
		super();
		this.shipmentId = requireTrimmedString(
			shipmentId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
			{ reason: 'shipmentId' },
		);
	}
}
