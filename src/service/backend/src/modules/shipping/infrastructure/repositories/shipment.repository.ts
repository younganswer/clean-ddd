import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IShipmentRepository } from '../../domains/repositories/i.shipment.repository';
import { ShipmentSchema } from '../schemas/shipment.schema';
import { ShipmentStatus } from '../../domains/shipment-status';
import { Shipment } from '../../domains/entities/aggregates/shipment/shipment.aggregate';
import { ShipmentMapper } from '../mappers/shipment.mapper';

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

  async createForOrder(orderId: string): Promise<Shipment> {
    const em = this.emForContext();
    const existing = await em.findOne(ShipmentSchema, { orderId });
    if (existing) return this.mapper.toDomain(existing);

    const shipment = em.create(ShipmentSchema, {
      orderId,
      status: ShipmentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(shipment);
    return this.mapper.toDomain(shipment);
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

  async findRecent(limit: number): Promise<Shipment[]> {
    const em = this.emForContext();
    const found = await em.find(
      ShipmentSchema,
      {},
      {
        limit,
        orderBy: { createdAt: 'desc' },
      },
    );

    return found.map((s) => this.mapper.toDomain(s));
  }
}
