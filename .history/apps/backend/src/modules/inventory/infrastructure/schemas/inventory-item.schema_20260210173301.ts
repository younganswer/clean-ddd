import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'inventory_items' })
@Index({ properties: ['updatedAt'] })
export class InventoryItemSchema {
  @PrimaryKey()
  sku!: string;

  @Property({ type: 'int' })
  availableQuantity: number = 0;

  @Property({ type: 'int' })
  reservedQuantity: number = 0;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}
