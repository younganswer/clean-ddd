import type { OrderStatus } from '@/modules/ordering/domain/enums/order-status.enum';

type OrderItemSchema = {
	sku: string;
	quantity: number;
};

type OrderSchema = {
	uuid: string;
	userId: string;
	status: OrderStatus;
	amount: number;
	currency: string;
	items: OrderItemSchema[];
	paymentId: string | null;
};

export class OrderItemResult {
	constructor(
		public readonly sku: string,
		public readonly quantity: number,
	) {}

	static fromSchema(schema: OrderItemSchema): OrderItemResult {
		return new OrderItemResult(schema.sku, schema.quantity);
	}
}

export class OrderResult {
	constructor(
		public readonly orderId: string,
		public readonly userId: string,
		public readonly status: OrderStatus,
		public readonly amount: number,
		public readonly currency: string,
		public readonly items: OrderItemResult[],
		public readonly paymentId: string | null,
	) {}

	static fromSchema(schema: OrderSchema): OrderResult {
		return new OrderResult(
			schema.uuid,
			schema.userId,
			schema.status,
			schema.amount,
			schema.currency,
			schema.items.map((item) => OrderItemResult.fromSchema(item)),
			schema.paymentId,
		);
	}
}
