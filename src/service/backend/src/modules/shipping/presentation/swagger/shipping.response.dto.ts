import { ApiProperty } from '@nestjs/swagger';

export class ShipmentResponseDto {
	@ApiProperty()
	shipmentId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	status!: string;
}
