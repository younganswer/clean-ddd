import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
	@ApiProperty()
	sku!: string;

	@ApiProperty()
	quantity!: number;
}

export class OrderResponseDto {
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

	@ApiProperty({ type: [OrderItemResponseDto] })
	items!: OrderItemResponseDto[];

	@ApiProperty({ nullable: true })
	paymentId!: string | null;
}

export class CreateOrderResultResponseDto {
	@ApiProperty()
	orderId!: string;
}
