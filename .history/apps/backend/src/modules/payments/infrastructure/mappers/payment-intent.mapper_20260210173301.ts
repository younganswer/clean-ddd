import { Injectable } from '@nestjs/common';
import { PaymentIntent } from '../../domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentSchema } from '../schemas/payment-intent.schema';

@Injectable()
export class PaymentIntentMapper {
  toDomain(schema: PaymentIntentSchema): PaymentIntent {
    return PaymentIntent.rehydrate({
      id: schema.uuid,
      orderId: schema.orderId,
      amount: schema.amount,
      currency: schema.currency,
      status: schema.status,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  }
}
