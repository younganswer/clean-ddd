import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/modules/shipping/domains/readers/i.shipment.reader';
import { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';
import { normalizeReaderExternalPage } from '@/common/cqrs/pagination-policy';

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
		const page = normalizeReaderExternalPage(limit, offset);
		const list = await this.emForContext().find(
			ShipmentSchema,
			{},
			{
				limit: page.limit,
				offset: page.offset,
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
