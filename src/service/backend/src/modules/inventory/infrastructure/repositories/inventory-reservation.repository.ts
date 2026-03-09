import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { InventoryReservationMapper } from '@/modules/inventory/infrastructure/mappers/inventory-reservation.mapper';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';
import { SYSTEM_INFRA_ERRORS } from '@/shared/errors/catalogs/system.errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class InventoryReservationRepository implements IInventoryReservationRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: InventoryReservationMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	private transactionalEmForWrite(): EntityManager {
		const em = RequestContext.getEntityManager() as
			| EntityManager
			| undefined;
		if (!em) {
			throw InfrastructureErrorFactory.create(
				SYSTEM_INFRA_ERRORS.REQUEST_CONTEXT_TRANSACTION_REQUIRED,
				{
					details: {
						repository: InventoryReservationRepository.name,
						method: 'persist',
					},
				},
			);
		}
		return em;
	}

	async persist(reservation: InventoryReservation): Promise<void> {
		const em = this.transactionalEmForWrite();
		const schema = this.mapper.toSchema(reservation);
		const exists = await em.findOne(InventoryReservationSchema, {
			uuid: schema.uuid,
		});

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(InventoryReservationSchema, schema);
		}
	}

	async findByOrderAndSku(
		orderId: string,
		sku: string,
	): Promise<InventoryReservation | null> {
		const em = this.emForContext();
		const found = await em.findOne(InventoryReservationSchema, {
			orderId,
			sku,
		});
		return found ? this.mapper.toDomain(found) : null;
	}

	async findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservation[]> {
		const em = this.emForContext();
		const found = await em.find(
			InventoryReservationSchema,
			{ orderId },
			{
				orderBy: { id: 'asc' },
			},
		);

		return found.map((r) => this.mapper.toDomain(r));
	}
}
