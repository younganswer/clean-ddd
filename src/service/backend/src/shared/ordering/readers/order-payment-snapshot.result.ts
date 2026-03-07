type OrderSchema = {
	uuid: string;
	amount: number;
	currency: string;
};

export class OrderPaymentSnapshotResult {
	constructor(
		public readonly orderId: string,
		public readonly amount: number,
		public readonly currency: string,
	) {}

	static fromSchema(schema: OrderSchema): OrderPaymentSnapshotResult {
		return new OrderPaymentSnapshotResult(
			schema.uuid,
			schema.amount,
			schema.currency,
		);
	}
}
