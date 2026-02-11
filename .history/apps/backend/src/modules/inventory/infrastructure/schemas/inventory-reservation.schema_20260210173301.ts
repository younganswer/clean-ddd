import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'inventory_reservations' })
@Unique({ properties: ['orderId', 'sku'] })
@Index({ properties: ['createdAt'] })
export class InventoryReservationSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property({ type: 'uuid' })
  orderId!: string;

  @Property()
  sku!: string;

  @Property({ type: 'int' })
  quantity!: number;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();
}
