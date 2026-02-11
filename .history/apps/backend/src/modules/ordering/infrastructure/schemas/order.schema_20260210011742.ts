import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { OrderStatus } from '../../domains/order-status';

@Entity({ tableName: 'orders' })
@Index({ properties: ['status', 'createdAt'] })
export class OrderSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property({ type: 'string' })
  status: OrderStatus = OrderStatus.PENDING_PAYMENT;

  @Property({ type: 'int' })
  amount!: number;

  @Property()
  currency!: string;

  @Property({ type: 'jsonb' })
  items: Array<{ sku: string; quantity: number }> = [{ sku: 'SKU-001', quantity: 1 }];

  @Property({ type: 'uuid', nullable: true })
  paymentId: string | null = null;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}
