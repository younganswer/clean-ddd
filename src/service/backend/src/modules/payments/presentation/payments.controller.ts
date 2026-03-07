import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { CreatePaymentIntentResponse } from '@/modules/payments/presentation/swagger';
import { CreatePaymentIntentCommand } from '@/modules/payments/application/commands/create-payment-intent.command';
import { CreatePaymentIntentRequest } from '@/modules/payments/presentation/dto/create-payment-intent.request';

@Controller('orders/:orderId/payments')
export class PaymentsController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post('intents')
	@ApiDataResponse({ model: CreatePaymentIntentResponse }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async createIntent(
		@Param('orderId') orderId: string,
		@Body() body: CreatePaymentIntentRequest,
	): Promise<DataEnvelope<CreatePaymentIntentResponse>> {
		const result = await this.commandBus.execute(
			new CreatePaymentIntentCommand({
				orderId,
				simulateOutcome: body.simulateOutcome,
				simulateDelaySeconds:
					body.simulateDelaySeconds !== undefined
						? Number(body.simulateDelaySeconds)
						: undefined,
			}),
		);
		return ResponseHelper.data(
			CreatePaymentIntentResponse.fromResult(result),
		);
	}
}
