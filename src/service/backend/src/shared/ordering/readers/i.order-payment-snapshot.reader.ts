import type { OrderPaymentSnapshotResult } from '@/shared/ordering/readers/order-payment-snapshot.result';

export const IOrderPaymentSnapshotReaderSymbol = Symbol(
	'IOrderPaymentSnapshotReader',
);

export interface IOrderPaymentSnapshotReader {
	getByOrderId(orderId: string): Promise<OrderPaymentSnapshotResult>;
}
