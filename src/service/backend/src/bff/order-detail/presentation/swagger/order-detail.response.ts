import { ApiProperty } from '@nestjs/swagger';
import { InventoryReservationResponse } from '@/modules/inventory/presentation/swagger';
import { OrderResponse } from '@/modules/ordering/presentation/swagger';
import { PaymentIntentResponse } from '@/modules/payments/presentation/swagger';
import { ShipmentResponse } from '@/modules/shipping/presentation/swagger';
import type { OrderDetailBffView } from '@/bff/order-detail/application/views/order-detail-bff.view';

export class OrderDetailBffResponse {
	@ApiProperty({ type: OrderResponse })
	order!: OrderResponse;

	@ApiProperty({ type: PaymentIntentResponse, nullable: true })
	paymentIntent!: PaymentIntentResponse | null;

	@ApiProperty({ type: ShipmentResponse, nullable: true })
	shipment!: ShipmentResponse | null;

	@ApiProperty({ type: [InventoryReservationResponse] })
	reservations!: InventoryReservationResponse[];

	@ApiProperty({ required: false, type: [String] })
	partialErrors?: string[];

	static fromResult(result: OrderDetailBffView): OrderDetailBffResponse {
		return {
			order: OrderResponse.fromResult(result.order),
			paymentIntent: result.paymentIntent
				? PaymentIntentResponse.fromResult(result.paymentIntent)
				: null,
			shipment: result.shipment
				? ShipmentResponse.fromResult(result.shipment)
				: null,
			reservations: InventoryReservationResponse.fromResults(
				result.reservations,
			),
			partialErrors: result.partialErrors,
		};
	}
}
