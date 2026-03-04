import { Command } from '@nestjs/cqrs';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export type CreateShipmentForOrderResult = {
	shipmentId: string;
};

export class CreateShipmentForOrderCommand extends Command<CreateShipmentForOrderResult> {
	public readonly orderId: string;

	constructor(orderId: string) {
		super();
		this.orderId = requireTrimmedString(
			orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
		);
	}
}
