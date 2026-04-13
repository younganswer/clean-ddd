import { Command } from '@nestjs/cqrs';
import {
	OrderingOrderIdRequiredException,
	OrderingPaymentIdRequiredException,
} from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class AttachPaymentToOrderCommand extends Command<void> {
	public readonly orderId: string;
	public readonly paymentId: string;

	constructor(input: { orderId: string; paymentId: string }) {
		super();
		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				OrderingOrderIdRequiredException,
			);
		}

		const paymentId = toTrimmedString(input.paymentId);
		if (!paymentId) {
			throw ApplicationExceptionFactory.create(
				OrderingPaymentIdRequiredException,
			);
		}

		this.orderId = orderId;
		this.paymentId = paymentId;
	}
}
