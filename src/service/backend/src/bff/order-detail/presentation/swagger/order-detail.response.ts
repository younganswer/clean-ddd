import { ApiProperty } from '@nestjs/swagger';
import { InventoryReservationResponse } from '@/modules/inventory/presentation/swagger/inventory.response';
import { OrderResponse } from '@/modules/ordering/presentation/swagger/orders.response';
import { PaymentIntentResponse } from '@/modules/payments/presentation/swagger/payments.response';
import { ShipmentResponse } from '@/modules/shipping/presentation/swagger/shipping.response';
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

	@ApiProperty({
		required: false,
		type: 'array',
		items: {
			type: 'object',
			properties: {
				domain: { type: 'string' },
				message: { type: 'string' },
			},
		},
	})
	partialErrors?: Array<{ domain: string; message: string }>;

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
