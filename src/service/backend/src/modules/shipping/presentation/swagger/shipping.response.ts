import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

export class ShipmentResponse {
	@ApiProperty()
	shipmentId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty()
	status!: string;

	static fromResult(result: ShipmentResult): ShipmentResponse {
		return {
			shipmentId: result.shipmentId,
			orderId: result.orderId,
			status: String(result.status),
		};
	}

	static fromResults(results: ShipmentResult[]): ShipmentResponse[] {
		return results.map((result) => ShipmentResponse.fromResult(result));
	}

	static fromPaginatedResults(
		page: PaginatedResult<ShipmentResult>,
	): PaginatedResult<ShipmentResponse> {
		return {
			...page,
			items: ShipmentResponse.fromResults(page.items),
		};
	}
}
