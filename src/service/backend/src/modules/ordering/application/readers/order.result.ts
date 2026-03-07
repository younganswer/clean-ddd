import type { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

export type OrderItemResult = {
	sku: string;
	quantity: number;
};

export type OrderResult = {
	orderId: string;
	userId: string;
	status: OrderStatus;
	amount: number;
	currency: string;
	items: OrderItemResult[];
	paymentId: string | null;
};
