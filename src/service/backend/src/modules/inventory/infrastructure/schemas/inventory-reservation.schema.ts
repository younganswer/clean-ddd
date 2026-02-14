import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'inventory_reservations' })
@Unique({ properties: ['orderId', 'sku'] })
@Index({ properties: ['createdAt'] })
export class InventoryReservationSchema extends BaseSchema {
  @Property({ type: 'uuid' })
  orderId!: string;

  @Property()
  sku!: string;

  @Property({ type: 'int' })
  quantity!: number;
}
