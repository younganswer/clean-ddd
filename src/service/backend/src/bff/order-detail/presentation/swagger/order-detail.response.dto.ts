import { ApiProperty } from '@nestjs/swagger';
import { InventoryReservationResponseDto } from '@/modules/inventory/presentation/swagger';
import { OrderResponseDto } from '@/modules/ordering/presentation/swagger';
import { PaymentIntentResponseDto } from '@/modules/payments/presentation/swagger';
import { ShipmentResponseDto } from '@/modules/shipping/presentation/swagger';

export class OrderDetailBffResponseDto {
	@ApiProperty({ type: OrderResponseDto })
	order!: OrderResponseDto;

	@ApiProperty({ type: PaymentIntentResponseDto, nullable: true })
	paymentIntent!: PaymentIntentResponseDto | null;

	@ApiProperty({ type: ShipmentResponseDto, nullable: true })
	shipment!: ShipmentResponseDto | null;

	@ApiProperty({ type: [InventoryReservationResponseDto] })
	reservations!: InventoryReservationResponseDto[];

	@ApiProperty({ required: false, type: [String] })
	partialErrors?: string[];
}
