import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type {
	OrderItemResult,
	OrderResult,
} from '@/modules/ordering/domains/readers/order.result';
import { MoneyResponse } from '@/shared/money/presentation/swagger/money.response';

export class OrderItemResponse {
	@ApiProperty()
	sku!: string;

	@ApiProperty()
	quantity!: number;

	static fromResult(result: OrderItemResult): OrderItemResponse {
		return {
			sku: result.sku,
			quantity: result.quantity,
		};
	}
}

export class OrderResponse {
	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	userId!: string;

	@ApiProperty()
	status!: string;

	@ApiProperty({ type: MoneyResponse })
	money!: MoneyResponse;

	@ApiProperty({ type: [OrderItemResponse] })
	items!: OrderItemResponse[];

	@ApiProperty({ nullable: true })
	paymentId!: string | null;

	static fromResult(result: OrderResult): OrderResponse {
		return {
			orderId: result.orderId,
			userId: result.userId,
			status: String(result.status),
			money: MoneyResponse.fromAmountMinor(
				result.amount,
				result.currency,
			),
			items: result.items.map((item) =>
				OrderItemResponse.fromResult(item),
			),
			paymentId: result.paymentId,
		};
	}

	static fromResults(results: OrderResult[]): OrderResponse[] {
		return results.map((result) => OrderResponse.fromResult(result));
	}

	static fromPaginatedResults(
		page: PaginatedResult<OrderResult>,
	): PaginatedResult<OrderResponse> {
		return {
			...page,
			items: OrderResponse.fromResults(page.items),
		};
	}
}

export class CreateOrderResponse {
	@ApiProperty()
	orderId!: string;

	static fromResult(result: { orderId: string }): CreateOrderResponse {
		return {
			orderId: result.orderId,
		};
	}
}
