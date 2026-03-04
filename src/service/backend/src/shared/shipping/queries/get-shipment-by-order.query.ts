import { Query } from '@nestjs/cqrs';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetShipmentByOrderQuery extends Query<ShipmentView | null> {
	public readonly orderId: string;

	constructor(orderId: string) {
		super();
		this.orderId = requireTrimmedString(
			orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
		);
	}
}
