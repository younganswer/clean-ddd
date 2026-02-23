export class AttachPaymentToOrderCommand {
	constructor(
		public readonly input: {
			orderId: string;
			paymentId: string;
		},
	) {}
}
