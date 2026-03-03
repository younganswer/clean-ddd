import { Command } from '@nestjs/cqrs';

export class AttachPaymentToOrderCommand extends Command<void> {
	constructor(
		public readonly input: {
			orderId: string;
			paymentId: string;
		},
	) {
		super();
	}
}
