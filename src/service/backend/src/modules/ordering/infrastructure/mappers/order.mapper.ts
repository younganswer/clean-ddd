import { Injectable } from '@nestjs/common';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';

@Injectable()
export class OrderMapper {
	toDomain(schema: OrderSchema): Order {
		return Order.rehydrate({
			uuid: schema.uuid,
			userId: schema.userId,
			status: schema.status,
			total: Money.of(schema.amount, schema.currency),
			items: (schema.items ?? []).map((i) =>
				OrderItem.of(i.sku, i.quantity),
			),
			paymentId: schema.paymentId,
			orderedAt: schema.orderedAt,
			paidAt: schema.paidAt,
		});
	}

	toSchema(order: Order): OrderSchema {
		const primitives = order.toPrimitives();

		return new OrderSchema({
			uuid: primitives.orderId,
			userId: primitives.userId,
			status: primitives.status,
			amount: primitives.total.amount,
			currency: primitives.total.currency,
			items: primitives.items.map((i) => ({
				sku: i.sku,
				quantity: i.quantity,
			})),
			paymentId: primitives.paymentId,
			orderedAt: primitives.orderedAt,
			paidAt: primitives.paidAt,
		});
	}
}
