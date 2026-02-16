import { Injectable } from '@nestjs/common';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';

@Injectable()
export class OrderMapper {
  toDomain(schema: OrderSchema): Order {
    if (schema.id == null) {
      throw new Error('OrderSchema.id is required');
    }

    return Order.rehydrate({
      id: schema.id,
      uuid: schema.uuid,
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
