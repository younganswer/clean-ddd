import { Entity, Index, Property } from '@mikro-orm/core';
import { PaymentStatus } from '@/modules/payments/domains/payment-status';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'payment_intents' })
@Index({ properties: ['orderId', 'createdAt'] })
export class PaymentIntentSchema extends BaseSchema {
  @Property({ type: 'uuid' })
  orderId!: string;

  @Property({ type: 'int' })
  amount!: number;

  @Property()
  currency!: string;

  @Property({ type: 'string' })
  status: PaymentStatus = PaymentStatus.PENDING;
}
