import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '../../../../shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'inventory_items' })
@Index({ properties: ['updatedAt'] })
@Unique({ properties: ['sku'] })
export class InventoryItemSchema extends BaseSchema {
  @Property()
  sku!: string;

  @Property({ type: 'int' })
  availableQuantity: number = 0;

  @Property({ type: 'int' })
  reservedQuantity: number = 0;
}
