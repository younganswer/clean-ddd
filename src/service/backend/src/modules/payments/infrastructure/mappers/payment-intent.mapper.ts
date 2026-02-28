import { Injectable } from '@nestjs/common';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';

@Injectable()
export class PaymentIntentMapper {
	toDomain(schema: PaymentIntentSchema): PaymentIntent {
		return PaymentIntent.rehydrate({
			id: schema.uuid,
			orderId: schema.orderId,
			amount: schema.amount,
			currency: schema.currency,
			status: schema.status,
		});
	}

	toSchema(payment: PaymentIntent): PaymentIntentSchema {
		const primitives = payment.toPrimitives();
		return new PaymentIntentSchema({
			uuid: primitives.paymentId,
			orderId: primitives.orderId,
			amount: primitives.amount,
			currency: primitives.currency,
			status: primitives.status,
		});
	}
}
