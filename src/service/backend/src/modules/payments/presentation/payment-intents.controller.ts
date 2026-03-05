import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common';
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
	ListPaymentIntentsQuery,
	type PaymentIntentResult,
} from '@/shared/payments';

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
		@Query('limit') limitRaw?: string,
	): Promise<ListEnvelope<PaymentIntentResponse>> {
		const result = await this.queryBus.execute<
			ListPaymentIntentsQuery,
			PaymentIntentResult[]
		>(new ListPaymentIntentsQuery(Number(limitRaw)));

		if (!Array.isArray(result) || !result.every(isPaymentIntentResult)) {
			throw new InternalServerErrorException('invalid payments result');
		}

		return ResponseHelper.list(PaymentIntentResponse.fromResults(result));
	}

	@Get(':paymentId')
	@ApiDataResponse({ model: PaymentIntentResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('paymentId') paymentId: string,
	): Promise<DataEnvelope<PaymentIntentResponse>> {
		const result = await this.queryBus.execute<PaymentIntentResult | null>(
			new GetPaymentIntentQuery(paymentId),
		);

		if (result === null || result === undefined) {
			throw new NotFoundException('payment intent not found');
		}

		if (!isPaymentIntentResult(result)) {
			throw new InternalServerErrorException(
				'invalid payment intent result',
			);
		}

		return ResponseHelper.data(PaymentIntentResponse.fromResult(result));
	}
}
