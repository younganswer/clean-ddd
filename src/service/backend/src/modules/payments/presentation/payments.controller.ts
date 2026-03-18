import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { CreatePaymentIntentResponse } from '@/modules/payments/presentation/swagger/payments.response';
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
		const command = new CreatePaymentIntentCommand({
			orderId,
			simulateOutcome: body.simulateOutcome,
			simulateDelaySeconds:
				body.simulateDelaySeconds !== undefined
					? Number(body.simulateDelaySeconds)
					: undefined,
		});
		const result = await this.commandBus.execute(command);
		const response = CreatePaymentIntentResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
