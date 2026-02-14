import { Injectable } from '@nestjs/common';
import { Order } from '../../domains/entities/aggregates/order/order.aggregate';
import { Money } from '../../domains/value-objects/money.vo';
import { OrderItem } from '../../domains/value-objects/order-item.vo';
import { OrderSchema } from '../schemas/order.schema';

@Injectable()
export class OrderMapper {
  toDomain(schema: OrderSchema): Order {
    return Order.rehydrate({
      id: schema.uuid,
      userId: schema.userId,
      status: schema.status,
      total: Money.of(schema.amount, schema.currency),
      items: (schema.items ?? []).map((i) => OrderItem.of(i.sku, i.quantity)),
      paymentId: schema.paymentId,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  }
}
