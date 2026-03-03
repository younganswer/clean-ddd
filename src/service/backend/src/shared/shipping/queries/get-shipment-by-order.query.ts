import { Query } from '@nestjs/cqrs';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';

export class GetShipmentByOrderQuery extends Query<ShipmentView | null> {
	constructor(public readonly orderId: string) {
		super();
	}
}
