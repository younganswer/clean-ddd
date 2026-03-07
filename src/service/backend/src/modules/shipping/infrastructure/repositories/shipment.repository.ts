import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';
import { ShipmentMapper } from '@/modules/shipping/infrastructure/mappers/shipment.mapper';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class ShipmentRepository implements IShipmentRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: ShipmentMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async persist(shipment: Shipment): Promise<void> {
		const em = this.emForContext();
		const schema = this.mapper.toSchema(shipment);
		const exists = await em.findOne(ShipmentSchema, {
			uuid: schema.uuid,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(ShipmentSchema, schema);
		}
	}

	async getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<Shipment> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() =>
				ApplicationErrorFactory.create(
					SHIPPING_APPLICATION_ERRORS.SHIPMENT_NOT_FOUND,
					{ details: { id } },
				));
		const found = await em.findOneOrFail(
			ShipmentSchema,
			{ uuid: id },
			{ failHandler },
		);

		return this.mapper.toDomain(found);
	}

	async findById(id: string): Promise<Shipment | null> {
		const em = this.emForContext();
		const found = await em.findOne(ShipmentSchema, { uuid: id });
		return found ? this.mapper.toDomain(found) : null;
	}

	async findByOrderId(orderId: string): Promise<Shipment | null> {
		const em = this.emForContext();
		const found = await em.findOne(ShipmentSchema, { orderId });
		return found ? this.mapper.toDomain(found) : null;
	}

	async findRecent(limit: number, offset: number = 0): Promise<Shipment[]> {
		const em = this.emForContext();
		const found = await em.find(
			ShipmentSchema,
			{},
			{
				limit,
				offset: Math.max(0, Number(offset ?? 0) || 0),
				orderBy: { id: 'asc' },
			},
		);

		return found.map((s) => this.mapper.toDomain(s));
	}

	async countAll(): Promise<number> {
		const em = this.emForContext();
		return await em.count(ShipmentSchema, {});
	}
}
