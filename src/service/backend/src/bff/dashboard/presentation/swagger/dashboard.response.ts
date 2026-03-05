import { ApiProperty } from '@nestjs/swagger';
import { InventoryItemResponse } from '@/modules/inventory/presentation/swagger';
import { OrderResponse } from '@/modules/ordering/presentation/swagger';
import { PaymentIntentResponse } from '@/modules/payments/presentation/swagger';
import { ShipmentResponse } from '@/modules/shipping/presentation/swagger';
import type { DashboardSummaryBffView } from '@/bff/dashboard/application/views/dashboard-summary-bff.view';

export class DashboardSummaryBffResponse {
	@ApiProperty({ type: [OrderResponse] })
	orders!: OrderResponse[];

	@ApiProperty({ type: [PaymentIntentResponse] })
	paymentIntents!: PaymentIntentResponse[];

	@ApiProperty({ type: [ShipmentResponse] })
	shipments!: ShipmentResponse[];

	@ApiProperty({ type: [InventoryItemResponse] })
	inventoryItems!: InventoryItemResponse[];

	@ApiProperty({ required: false, type: [String] })
	partialErrors?: string[];

	static fromResult(
		result: DashboardSummaryBffView,
	): DashboardSummaryBffResponse {
		return {
			orders: OrderResponse.fromResults(result.orders),
			paymentIntents: PaymentIntentResponse.fromResults(
				result.paymentIntents,
			),
			shipments: ShipmentResponse.fromResults(result.shipments),
			inventoryItems: InventoryItemResponse.fromResults(
				result.inventoryItems,
			),
			partialErrors: result.partialErrors,
		};
	}
}
