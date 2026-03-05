import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ListEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
} from '@/common/swagger';
import { PaymentIntentResponse } from '@/modules/payments/presentation/swagger';
import {
	GetPaymentIntentQuery,
	GetPaymentIntentsQuery,
	type PaymentIntentResult,
} from '@/shared/payments';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

const isPaymentIntentResult = (
	value: unknown,
): value is PaymentIntentResult => {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;

	return (
		typeof record.paymentId === 'string' &&
		typeof record.orderId === 'string' &&
		typeof record.amount === 'number' &&
		typeof record.currency === 'string' &&
		typeof record.status === 'string'
	);
};

@Controller('payments/intents')
export class PaymentIntentsController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiListResponse({ model: PaymentIntentResponse })
	@ApiErrorEnvelopeResponse({ status: 500 })
	async list(
		@Query('limit') limit?: string,
	): Promise<ListEnvelope<PaymentIntentResponse>> {
		const result = await this.queryBus.execute(
			new GetPaymentIntentsQuery({
				limit: limit ? Number.parseInt(limit, 10) : undefined,
			}),
		);
		if (!Array.isArray(result) || !result.every(isPaymentIntentResult)) {
			throw ApplicationErrorFactory.create(
				PAYMENTS_APPLICATION_ERRORS.PAYMENTS_RESULT_INVALID,
			);
		}
		const response = PaymentIntentResponse.fromResults(result);

		return ResponseHelper.list(response);
	}

	@Get(':paymentId')
	@ApiDataResponse({ model: PaymentIntentResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('paymentId') paymentId: string,
	): Promise<DataEnvelope<PaymentIntentResponse>> {
		const result = await this.queryBus.execute(
			new GetPaymentIntentQuery({ paymentId }),
		);
		if (result === null || result === undefined) {
			throw ApplicationErrorFactory.create(
				PAYMENTS_APPLICATION_ERRORS.PAYMENT_NOT_FOUND,
				{ message: 'payment intent not found' },
			);
		}
		if (!isPaymentIntentResult(result)) {
			throw ApplicationErrorFactory.create(
				PAYMENTS_APPLICATION_ERRORS.PAYMENT_INTENT_RESULT_INVALID,
			);
		}
		const response = PaymentIntentResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
