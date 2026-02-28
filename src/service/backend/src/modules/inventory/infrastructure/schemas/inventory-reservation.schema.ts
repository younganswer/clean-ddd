import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'inventory_reservations' })
@Unique({ properties: ['orderId', 'sku'] })
@Index({ properties: ['createdAt'] })
export class InventoryReservationSchema extends BaseSchema {
	constructor(
		input: Omit<
			InventoryReservationSchema,
			'id' | 'createdAt' | 'updatedAt'
		>,
	) {
		super(input.uuid);
		this.orderId = input.orderId;
		this.sku = input.sku;
		this.quantity = input.quantity;
	}

	@Property({ type: 'uuid' })
	orderId!: string;

	@Property()
	sku!: string;

	@Property({ type: 'int' })
	quantity!: number;
}
