import { Entity, Index, Property } from '@mikro-orm/core';
import { PaymentStatus } from '@/shared/payments';
import { BaseSchema } from '@/common/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'payment_intents' })
@Index({ properties: ['orderId', 'createdAt'] })
export class PaymentIntentSchema extends BaseSchema {
	constructor(input: PaymentIntentSchemaConstructorInput) {
		super(input.uuid);
		this.orderId = input.orderId;
		this.amount = input.amount;
		this.currency = input.currency;
		this.status = input.status ?? PaymentStatus.PENDING;
	}

	@Property({ type: 'uuid' })
	orderId!: string;

	@Property({ type: 'int' })
	amount!: number;

	@Property()
	currency!: string;

	@Property({ type: 'string' })
	status: PaymentStatus = PaymentStatus.PENDING;
}

type PaymentIntentSchemaConstructorInput = Omit<
	PaymentIntentSchema,
	'id' | 'createdAt' | 'updatedAt' | 'status'
> &
	Partial<Pick<PaymentIntentSchema, 'status'>>;
