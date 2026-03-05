import { Inject, Injectable } from '@nestjs/common';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';

@Injectable()
export class OrderReader implements IOrderReader {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
	) {}

	async findById(id: string): Promise<OrderResult | null> {
		const order = await this.orderRepository.findById(id);
		if (!order) return null;

		return this.toResult(order);
	}

	async findRecent(
		limit: number,
		offset: number = 0,
	): Promise<OrderResult[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const orderRepository = await this.orderRepository.findRecent(
			safeLimit,
			safeOffset,
		);
		return orderRepository.map((o) => this.toResult(o));
	}

	async findByUserId(
		userId: string,
		limit: number,
		offset: number = 0,
	): Promise<OrderResult[]> {
		const safeLimit = Math.min(200, Math.max(1, Number(limit ?? 50) || 50));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const orderRepository = await this.orderRepository.findByUserId(
			userId,
			safeLimit,
			safeOffset,
		);
		return orderRepository.map((o) => this.toResult(o));
	}

	async countAll(): Promise<number> {
		return await this.orderRepository.countAll();
	}

	private toResult(order: {
		id: string;
		userId: string;
		status: OrderResult['status'];
		amount: number;
		currency: string;
		items: OrderResult['items'];
		paymentId: string | null;
	}): OrderResult {
		return {
			orderId: order.id,
			userId: order.userId,
			status: order.status,
			amount: order.amount,
			currency: order.currency,
			items: order.items,
			paymentId: order.paymentId,
		};
	}
}

export const OrderReaderProvider = {
	provide: IOrderReaderSymbol,
	useClass: OrderReader,
};
