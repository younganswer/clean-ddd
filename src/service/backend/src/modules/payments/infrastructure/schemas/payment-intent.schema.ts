import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { PaymentStatus } from '../../domains/payment-status';

@Entity({ tableName: 'payment_intents' })
@Index({ properties: ['orderId', 'createdAt'] })
export class PaymentIntentSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property({ type: 'uuid' })
  orderId!: string;

  @Property({ type: 'int' })
  amount!: number;

  @Property()
  currency!: string;

  @Property({ type: 'string' })
  status: PaymentStatus = PaymentStatus.PENDING;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}
