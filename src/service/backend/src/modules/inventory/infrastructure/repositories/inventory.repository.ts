import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { InventoryOrderItem } from '../../domains/inventory-item';
import type { IInventoryRepository } from '../../domains/repositories/i.inventory.repository';
import { InventoryItem } from '../../domains/entities/inventory-item.entity';
import { InventoryReservation } from '../../domains/entities/inventory-reservation.entity';
import { InventoryItemMapper } from '../mappers/inventory-item.mapper';
import { InventoryReservationMapper } from '../mappers/inventory-reservation.mapper';
import { InventoryItemSchema } from '../schemas/inventory-item.schema';
import { InventoryReservationSchema } from '../schemas/inventory-reservation.schema';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly itemMapper: InventoryItemMapper,
    private readonly reservationMapper: InventoryReservationMapper,
  ) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async seedIfEmpty(): Promise<void> {
    const em = this.emForContext();
    const count = await em.count(InventoryItemSchema, {});
    if (count > 0) return;

    const item = em.create(InventoryItemSchema, {
      sku: 'SKU-001',
      availableQuantity: 100,
      reservedQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(item);
  }

  async findAll(limit: number): Promise<InventoryItem[]> {
    const em = this.emForContext();
    const found = await em.find(
      InventoryItemSchema,
      {},
      {
        limit,
        orderBy: { updatedAt: 'desc' },
      },
    );

    return found.map((i) => this.itemMapper.toDomain(i));
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    const em = this.emForContext();
    const found = await em.findOne(InventoryItemSchema, { sku });
    return found ? this.itemMapper.toDomain(found) : null;
  }

  async reserveForOrder(
    orderId: string,
    items: InventoryOrderItem[],
  ): Promise<void> {
    const em = this.emForContext();
    for (const item of items) {
      const sku = String(item.sku ?? '');
      const quantity = Number(item.quantity ?? 0);
      if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('invalid reserve items');
      }

      const existingReservation = await em.findOne(InventoryReservationSchema, {
        orderId,
        sku,
      });
      if (existingReservation) continue;

      let stock = await em.findOne(InventoryItemSchema, { sku });
      if (!stock) {
        stock = em.create(InventoryItemSchema, {
          sku,
          availableQuantity: 0,
          reservedQuantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (stock.availableQuantity < quantity) {
        throw new Error(
          `insufficient stock: sku=${sku} available=${stock.availableQuantity} need=${quantity}`,
        );
      }

      stock.availableQuantity -= quantity;
      stock.reservedQuantity += quantity;
      stock.updatedAt = new Date();

      const reservation = em.create(InventoryReservationSchema, {
        orderId,
        sku,
        quantity,
        createdAt: new Date(),
      });

      await em.persistAndFlush([stock, reservation]);
    }
  }

  async findReservationsByOrderId(
    orderId: string,
  ): Promise<InventoryReservation[]> {
    const em = this.emForContext();
    const found = await em.find(
      InventoryReservationSchema,
      { orderId },
      {
        orderBy: { createdAt: 'desc' },
      },
    );

    return found.map((r) => this.reservationMapper.toDomain(r));
  }
}
