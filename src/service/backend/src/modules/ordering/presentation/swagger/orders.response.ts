import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type {
	OrderItemResult,
	OrderResult,
} from '@/shared/ordering/readers/order.result';

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

	@ApiProperty()
	amount!: number;

	@ApiProperty()
	currency!: string;

	@ApiProperty({ type: [OrderItemResponse] })
	items!: OrderItemResponse[];

	@ApiProperty({ nullable: true })
	paymentId!: string | null;

	static fromResult(result: OrderResult): OrderResponse {
		return {
			orderId: result.orderId,
			userId: result.userId,
			status: String(result.status),
			amount: result.amount,
			currency: result.currency,
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
