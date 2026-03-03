import { ApiProperty } from '@nestjs/swagger';
import { InventoryItemResponseDto } from '@/modules/inventory/presentation/swagger';
import { OrderResponseDto } from '@/modules/ordering/presentation/swagger';
import { PaymentIntentResponseDto } from '@/modules/payments/presentation/swagger';
import { ShipmentResponseDto } from '@/modules/shipping/presentation/swagger';

export class DashboardSummaryBffResponseDto {
	@ApiProperty({ type: [OrderResponseDto] })
	orders!: OrderResponseDto[];

	@ApiProperty({ type: [PaymentIntentResponseDto] })
	paymentIntents!: PaymentIntentResponseDto[];

	@ApiProperty({ type: [ShipmentResponseDto] })
	shipments!: ShipmentResponseDto[];

	@ApiProperty({ type: [InventoryItemResponseDto] })
	inventoryItems!: InventoryItemResponseDto[];

	@ApiProperty({ required: false, type: [String] })
	partialErrors?: string[];
}
