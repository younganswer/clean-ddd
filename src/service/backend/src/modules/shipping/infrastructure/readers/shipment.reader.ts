import { Inject, Injectable } from '@nestjs/common';

import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/shared/readers/shipping/i.shipment.reader';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';

@Injectable()
export class ShipmentReader implements IShipmentReader {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async findById(id: string): Promise<ShipmentView | null> {
		const s = await this.shipmentRepository.findById(id);
		if (!s) return null;
		return this.toView(s);
	}

	async findByOrderId(orderId: string): Promise<ShipmentView | null> {
		const s = await this.shipmentRepository.findByOrderId(orderId);
		if (!s) return null;
		return this.toView(s);
	}

	async findRecent(limit: number): Promise<ShipmentView[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const list = await this.shipmentRepository.findRecent(safeLimit);
		return list.map((s) => this.toView(s));
	}

	private toView(shipment: {
		id: string;
		orderId: string;
		status: ShipmentView['status'];
	}): ShipmentView {
		return {
			shipmentId: shipment.id,
			orderId: shipment.orderId,
			status: shipment.status,
		};
	}
}

export const ShipmentReaderProvider = {
	provide: IShipmentReaderSymbol,
	useClass: ShipmentReader,
};
