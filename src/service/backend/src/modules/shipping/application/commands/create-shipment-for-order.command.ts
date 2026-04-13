import { Command } from '@nestjs/cqrs';
import { ShippingOrderIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export type CreateShipmentForOrderResult = {
	shipmentId: string;
};

export class CreateShipmentForOrderCommand extends Command<CreateShipmentForOrderResult> {
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
