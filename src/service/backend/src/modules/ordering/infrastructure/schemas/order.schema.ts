import { Entity, Index, Property } from '@mikro-orm/core';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'orders' })
@Index({ properties: ['status', 'createdAt'] })
export class OrderSchema extends BaseSchema {
	@Property({ type: 'uuid' })
	userId!: string;

	@Property({ type: 'string' })
	status: OrderStatus = OrderStatus.PENDING_PAYMENT;

	@Property({ type: 'int' })
	amount!: number;

	@Property()
	currency!: string;

	@Property({ type: 'jsonb' })
	items: Array<{ sku: string; quantity: number }> = [
		{ sku: 'SKU-001', quantity: 1 },
	];

	@Property({ type: 'uuid', nullable: true })
	paymentId: string | null = null;
}
