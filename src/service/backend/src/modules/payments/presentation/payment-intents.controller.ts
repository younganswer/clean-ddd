import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { executeQuery } from 'src/common/utils/cqrs-executor';
import {
  GetPaymentIntentQuery,
  ListPaymentIntentsQuery,
  type PaymentIntentView,
} from '../../../shared/payments';

function isPaymentIntentView(value: unknown): value is PaymentIntentView {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.paymentId === 'string' &&
    typeof record.orderId === 'string' &&
    typeof record.amount === 'number' &&
    typeof record.currency === 'string' &&
    typeof record.status === 'string' &&
    record.createdAt instanceof Date &&
    record.updatedAt instanceof Date
  );
}

@Controller('payments/intents')
export class PaymentIntentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query('limit') limitRaw?: string): Promise<PaymentIntentView[]> {
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20')));

    const result = await executeQuery(
      this.queryBus,
      new ListPaymentIntentsQuery(limit),
    );

    if (!Array.isArray(result) || !result.every(isPaymentIntentView)) {
      throw new InternalServerErrorException('invalid payments view result');
    }

    return result;
  }

  @Get(':paymentId')
  async get(@Param('paymentId') paymentId: string): Promise<PaymentIntentView> {
    const result = await executeQuery(
      this.queryBus,
      new GetPaymentIntentQuery(paymentId),
    );

    if (result === null || result === undefined) {
      throw new NotFoundException('payment intent not found');
    }

    if (!isPaymentIntentView(result)) {
      throw new InternalServerErrorException('invalid payment intent view');
    }

    return result;
  }
}
