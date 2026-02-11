import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ShipmentSchema } from '../schemas/shipment.schema';
import { ShipmentStatus } from '../../domains/shipment-status';

@Injectable()
export class ShipmentRepository {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async createForOrder(orderId: string): Promise<ShipmentSchema> {
    const em = this.emForContext();
    const existing = await em.findOne(ShipmentSchema, { orderId });
    if (existing) return existing;

    const shipment = em.create(ShipmentSchema, {
      orderId,
      status: ShipmentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(shipment);
    return shipment;
  }

  async findById(id: string): Promise<ShipmentSchema | null> {
    const em = this.emForContext();
    return em.findOne(ShipmentSchema, { uuid: id });
  }

  async findByOrderId(orderId: string): Promise<ShipmentSchema | null> {
    const em = this.emForContext();
    return em.findOne(ShipmentSchema, { orderId });
  }

  async findRecent(limit: number): Promise<ShipmentSchema[]> {
    const em = this.emForContext();
    return em.find(
      ShipmentSchema,
      {},
      {
        limit,
        orderBy: { createdAt: 'desc' },
      },
    );
  }
}
