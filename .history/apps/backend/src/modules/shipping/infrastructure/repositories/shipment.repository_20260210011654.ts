import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ShipmentSchema } from '../schemas/shipment.schema';

@Injectable()
export class ShipmentRepository {
  constructor(private readonly em: EntityManager) {}

  async createForOrder(orderId: string): Promise<ShipmentSchema> {
    const existing = await this.em.findOne(ShipmentSchema, { orderId });
    if (existing) return existing;

    const shipment = this.em.create(ShipmentSchema, {
      orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(shipment);
    return shipment;
  }

  async findById(id: string): Promise<ShipmentSchema | null> {
    return this.em.findOne(ShipmentSchema, { uuid: id });
  }

  async findByOrderId(orderId: string): Promise<ShipmentSchema | null> {
    return this.em.findOne(ShipmentSchema, { orderId });
  }

  async findRecent(limit: number): Promise<ShipmentSchema[]> {
    return this.em.find(
      ShipmentSchema,
      {},
      {
        limit,
        orderBy: { createdAt: 'desc' },
      },
    );
  }
}
