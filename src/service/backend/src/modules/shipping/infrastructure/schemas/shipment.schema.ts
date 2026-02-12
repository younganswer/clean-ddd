import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { ShipmentStatus } from '../../domains/shipment-status';
import { BaseSchema } from '../../../../shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'shipments' })
@Unique({ properties: ['orderId'] })
@Index({ properties: ['createdAt'] })
export class ShipmentSchema extends BaseSchema {
  @Property({ type: 'uuid' })
  orderId!: string;

  @Property({ type: 'string' })
  status: ShipmentStatus = ShipmentStatus.PENDING;
}
