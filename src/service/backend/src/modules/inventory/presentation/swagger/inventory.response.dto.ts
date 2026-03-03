import { ApiProperty } from '@nestjs/swagger';

export class MoneyResponseDto {
	@ApiProperty()
	currency!: string;

	@ApiProperty()
	amountMinor!: number;
}

export class InventoryItemResponseDto {
	@ApiProperty()
	itemId!: string;

	@ApiProperty()
	sku!: string;

	@ApiProperty({ type: MoneyResponseDto })
	price!: MoneyResponseDto;

	@ApiProperty()
	availableQuantity!: number;

	@ApiProperty()
	reservedQuantity!: number;
}

export class InventoryReservationResponseDto {
	@ApiProperty()
	reservationId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	sku!: string;

	@ApiProperty()
	quantity!: number;
}
