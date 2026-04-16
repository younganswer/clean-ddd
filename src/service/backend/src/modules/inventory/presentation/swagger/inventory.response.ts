import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import type { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';
import { MoneyResponse } from '@/shared/money/presentation/swagger/money.response';

export class InventoryItemResponse {
	@ApiProperty()
	itemId!: string;

	@ApiProperty()
	sku!: string;

	@ApiProperty({ type: MoneyResponse })
	price!: MoneyResponse;

	@ApiProperty()
	availableQuantity!: number;

	@ApiProperty()
	reservedQuantity!: number;

	static fromResult(result: InventoryItemResult): InventoryItemResponse {
		return {
			itemId: result.itemId,
			sku: result.sku,
			price: MoneyResponse.fromResult(result.price),
			availableQuantity: result.availableQuantity,
			reservedQuantity: result.reservedQuantity,
		};
	}

	static fromResults(
		results: InventoryItemResult[],
	): InventoryItemResponse[] {
		return results.map((result) =>
			InventoryItemResponse.fromResult(result),
		);
	}

	static fromPaginatedResults(
		page: PaginatedResult<InventoryItemResult>,
	): PaginatedResult<InventoryItemResponse> {
		return {
			...page,
			items: InventoryItemResponse.fromResults(page.items),
		};
	}
}

export class InventoryReservationResponse {
	@ApiProperty()
	reservationId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	sku!: string;

	@ApiProperty()
	quantity!: number;

	static fromResult(
		result: InventoryReservationResult,
	): InventoryReservationResponse {
		return {
			reservationId: result.reservationId,
			orderId: result.orderId,
			sku: result.sku,
			quantity: result.quantity,
		};
	}

	static fromResults(
		results: InventoryReservationResult[],
	): InventoryReservationResponse[] {
		return results.map((result) =>
			InventoryReservationResponse.fromResult(result),
		);
	}
}
