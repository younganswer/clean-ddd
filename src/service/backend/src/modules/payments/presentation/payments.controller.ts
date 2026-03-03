import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { CreatePaymentIntentResultResponseDto } from '@/modules/payments/presentation/swagger';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/shared/payments';
import { CreatePaymentIntentRequest } from '@/modules/payments/presentation/dto/create-payment-intent.request';

@Controller('orders/:orderId/payments')
export class PaymentsController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post('intents')
	@ApiDataResponse(
		{ model: CreatePaymentIntentResultResponseDto },
		{ status: 201 },
	)
	@ApiErrorEnvelopeResponse({ status: 400 })
	async createIntent(
		@Param('orderId') orderId: string,
		@Body() body: CreatePaymentIntentRequest,
	): Promise<DataResponse<CreatePaymentIntentResult>> {
		const result = await this.commandBus.execute<
			CreatePaymentIntentCommand,
			CreatePaymentIntentResult
		>(
			new CreatePaymentIntentCommand({
				orderId,
				simulateOutcome: body.simulateOutcome,
				simulateDelaySeconds:
					body.simulateDelaySeconds !== undefined
						? Number(body.simulateDelaySeconds)
						: undefined,
			}),
		);
		return DataResponse.of(result);
	}
}
