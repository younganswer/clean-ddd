import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'inventory_items' })
@Index({ properties: ['updatedAt'] })
@Unique({ properties: ['sku'] })
export class InventoryItemSchema extends BaseSchema {
	constructor(
		input: Omit<InventoryItemSchema, 'id' | 'createdAt' | 'updatedAt'>,
	) {
		super(input.uuid);
		this.sku = input.sku;
		this.priceCurrency = input.priceCurrency;
		this.priceAmountMinor = input.priceAmountMinor;
		this.availableQuantity = input.availableQuantity;
		this.reservedQuantity = input.reservedQuantity;
	}

	@Property()
	sku!: string;

	@Property({ length: 3 })
	priceCurrency!: string;

	@Property({ type: 'int' })
	priceAmountMinor!: number;

	@Property({ type: 'int' })
	availableQuantity!: number;

	@Property({ type: 'int' })
	reservedQuantity!: number;
}
