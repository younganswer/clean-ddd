import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { InventoryOrderItem } from '../../domains/inventory-item';
import { InventoryItemSchema } from '../schemas/inventory-item.schema';
import { InventoryReservationSchema } from '../schemas/inventory-reservation.schema';

@Injectable()
export class InventoryRepository {
  constructor(private readonly em: EntityManager) {}

  async seedIfEmpty(): Promise<void> {
    const count = await this.em.count(InventoryItemSchema, {});
    if (count > 0) return;

    const item = this.em.create(InventoryItemSchema, {
      sku: 'SKU-001',
      availableQuantity: 100,
      reservedQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(item);
  }

  async findAll(limit: number): Promise<InventoryItemSchema[]> {
    return this.em.find(
      InventoryItemSchema,
      {},
      {
        limit,
        orderBy: { updatedAt: 'desc' },
      },
    );
  }

  async findBySku(sku: string): Promise<InventoryItemSchema | null> {
    return this.em.findOne(InventoryItemSchema, { sku });
  }

  async reserveForOrder(orderId: string, items: InventoryOrderItem[]): Promise<void> {
    for (const item of items) {
      const sku = String(item.sku ?? '');
      const quantity = Number(item.quantity ?? 0);
      if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('invalid reserve items');
      }

      const existingReservation = await this.em.findOne(InventoryReservationSchema, { orderId, sku });
      if (existingReservation) continue;

      let stock = await this.em.findOne(InventoryItemSchema, { sku });
      if (!stock) {
        stock = this.em.create(InventoryItemSchema, {
          sku,
          availableQuantity: 0,
          reservedQuantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (stock.availableQuantity < quantity) {
        throw new Error(`insufficient stock: sku=${sku} available=${stock.availableQuantity} need=${quantity}`);
      }

      stock.availableQuantity -= quantity;
      stock.reservedQuantity += quantity;
      stock.updatedAt = new Date();

      const reservation = this.em.create(InventoryReservationSchema, {
        orderId,
        sku,
        quantity,
        createdAt: new Date(),
      });

      await this.em.persistAndFlush([stock, reservation]);
    }
  }

  async findReservationsByOrderId(orderId: string): Promise<InventoryReservationSchema[]> {
    return this.em.find(
      InventoryReservationSchema,
      { orderId },
      {
        orderBy: { createdAt: 'desc' },
      },
    );
  }
}
