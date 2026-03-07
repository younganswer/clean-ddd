import { Command } from '@nestjs/cqrs';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export type CreateShipmentForOrderResult = {
	shipmentId: string;
};

export class CreateShipmentForOrderCommand extends Command<CreateShipmentForOrderResult> {
	public readonly orderId: string;

	constructor(input: { orderId: string }) {
		super();
		this.orderId = requireTrimmedString(
			input.orderId,
			SHIPPING_APPLICATION_ERRORS.SHIPMENT_ORDER_ID_REQUIRED,
		);
	}
}
