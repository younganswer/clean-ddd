import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import {
	IOrderPaymentSnapshotReaderSymbol,
	type IOrderPaymentSnapshotReader,
} from '@/shared/ordering/readers/i.order-payment-snapshot.reader';
import type { OrderPaymentSnapshotResult } from '@/shared/ordering/readers/order-payment-snapshot.result';

@Injectable()
export class OrderPaymentSnapshotReader implements IOrderPaymentSnapshotReader {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async getByOrderId(orderId: string): Promise<OrderPaymentSnapshotResult> {
		const order = await this.orderReader.getById(orderId);

		return {
			orderId: order.orderId,
			amount: order.amount,
			currency: order.currency,
		};
	}
}

export const OrderPaymentSnapshotReaderProvider = {
	provide: IOrderPaymentSnapshotReaderSymbol,
	useClass: OrderPaymentSnapshotReader,
};
