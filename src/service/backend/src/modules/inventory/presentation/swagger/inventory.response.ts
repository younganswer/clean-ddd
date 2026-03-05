import { ApiProperty } from '@nestjs/swagger';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';
import type { MoneyResult } from '@/shared/money/money.result';

export class MoneyResponse {
	@ApiProperty()
	currency!: string;

	@ApiProperty()
	amountMinor!: number;

	static fromResult(result: MoneyResult): MoneyResponse {
		return {
			currency: result.currency,
			amountMinor: result.amountMinor,
		};
	}
}

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
