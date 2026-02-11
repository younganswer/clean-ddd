import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { ShipmentStatus } from '../../domains/shipment-status';

@Entity({ tableName: 'shipments' })
@Unique({ properties: ['orderId'] })
@Index({ properties: ['createdAt'] })
export class ShipmentSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property({ type: 'uuid' })
  orderId!: string;

  @Property({ type: 'string' })
  status: ShipmentStatus = ShipmentStatus.PENDING;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}
