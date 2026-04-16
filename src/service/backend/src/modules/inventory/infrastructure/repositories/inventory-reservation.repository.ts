import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IInventoryReservationRepositorySymbol,
	type IInventoryReservationRepository,
} from '@/modules/inventory/domain/repositories/i.inventory-reservation.repository';
import { InventoryReservation } from '@/modules/inventory/domain/entities/inventory-reservation.entity';
import { InventoryReservationMapper } from '@/modules/inventory/infrastructure/mappers/inventory-reservation.mapper';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';
import { SystemRequestContextTransactionRequiredException } from '@/shared/exceptions/catalogs/system.exception';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { useClassProviders } from '@/common/utils/nest-provider.helpers';

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

	private transactionalEmForWrite(method: string): EntityManager {
		const em = RequestContext.getEntityManager() as
			| EntityManager
			| undefined;
		if (!em) {
			throw InfrastructureExceptionFactory.create(
				SystemRequestContextTransactionRequiredException,
				{
					cause: {
						repository: InventoryReservationRepository.name,
						method,
					},
				},
			);
		}
		return em;
	}

	async persist(reservation: InventoryReservation): Promise<void> {
		const em = this.transactionalEmForWrite('persist');
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

	async delete(reservation: InventoryReservation): Promise<void> {
		const em = this.transactionalEmForWrite('delete');
		const schema = this.mapper.toSchema(reservation);
		const existing = await em.findOne(InventoryReservationSchema, {
			uuid: schema.uuid,
		});
		if (!existing) {
			return;
		}

		em.remove(existing);
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

export const InventoryReservationRepositoryProviders = useClassProviders(
	IInventoryReservationRepositorySymbol,
	InventoryReservationRepository,
);
