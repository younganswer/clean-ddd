import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse, ListResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
} from '@/common/swagger';
import { PaymentIntentResponseDto } from '@/modules/payments/presentation/swagger';
import {
	GetPaymentIntentQuery,
	ListPaymentIntentsQuery,
	type PaymentIntentView,
} from '@/shared/payments';

const isPaymentIntentView = (value: unknown): value is PaymentIntentView => {
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
	@ApiListResponse({ model: PaymentIntentResponseDto })
	@ApiErrorEnvelopeResponse({ status: 500 })
	async list(
		@Query('limit') limitRaw?: string,
	): Promise<ListResponse<PaymentIntentView>> {
		const result = await this.queryBus.execute<
			ListPaymentIntentsQuery,
			PaymentIntentView[]
		>(new ListPaymentIntentsQuery(Number(limitRaw)));

		if (!Array.isArray(result) || !result.every(isPaymentIntentView)) {
			throw new InternalServerErrorException(
				'invalid payments view result',
			);
		}

		return ListResponse.from(result);
	}

	@Get(':paymentId')
	@ApiDataResponse({ model: PaymentIntentResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('paymentId') paymentId: string,
	): Promise<DataResponse<PaymentIntentView>> {
		const result = await this.queryBus.execute<
			GetPaymentIntentQuery,
			PaymentIntentView | null
		>(new GetPaymentIntentQuery(paymentId));

		if (result === null || result === undefined) {
			throw new NotFoundException('payment intent not found');
		}

		if (!isPaymentIntentView(result)) {
			throw new InternalServerErrorException(
				'invalid payment intent view',
			);
		}

		return DataResponse.of(result);
	}
}
