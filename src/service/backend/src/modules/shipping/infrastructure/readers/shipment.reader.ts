import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/shared/readers/shipping/i.shipment.reader';
import { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';

@Injectable()
export class ShipmentReader implements IShipmentReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async findById(id: string): Promise<ShipmentResult | null> {
		const s = await this.emForContext().findOne(ShipmentSchema, {
			uuid: id,
		});
		if (!s) return null;
		return ShipmentResult.fromSchema(s);
	}

	async findByOrderId(orderId: string): Promise<ShipmentResult | null> {
		const s = await this.emForContext().findOne(ShipmentSchema, {
			orderId,
		});
		if (!s) return null;
		return ShipmentResult.fromSchema(s);
	}

	async findRecent(
		limit: number,
		offset: number = 0,
	): Promise<ShipmentResult[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const list = await this.emForContext().find(
			ShipmentSchema,
			{},
			{
				limit: safeLimit,
				offset: safeOffset,
				orderBy: { id: 'asc' },
			},
		);
		return list.map((shipment) => ShipmentResult.fromSchema(shipment));
	}

	async countAll(): Promise<number> {
		return await this.emForContext().count(ShipmentSchema, {});
	}
}

export const ShipmentReaderProvider = {
	provide: IShipmentReaderSymbol,
	useClass: ShipmentReader,
};
