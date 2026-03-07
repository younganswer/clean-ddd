import { Entity, Index, Property } from '@mikro-orm/core';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { BaseSchema } from '@/common/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'orders' })
@Index({ properties: ['status', 'createdAt'] })
export class OrderSchema extends BaseSchema {
	constructor(input: OrderSchemaConstructorInput) {
		super(input.uuid);
		this.userId = input.userId;
		this.status = input.status;
		this.amount = input.amount;
		this.currency = input.currency;
		this.items = input.items;
		this.paymentId = input.paymentId;
		this.orderedAt = input.orderedAt;
		this.paidAt = input.paidAt ?? null;
	}

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

	@Property({ type: 'timestamptz' })
	orderedAt!: Date;

	@Property({ type: 'timestamptz', nullable: true })
	paidAt: Date | null = null;
}

type OrderSchemaConstructorInput = Omit<
	OrderSchema,
	'id' | 'createdAt' | 'updatedAt' | 'paidAt'
> &
	Partial<Pick<OrderSchema, 'paidAt'>>;
