import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/shared/payments';
import { CreatePaymentIntentRequest } from '@/modules/payments/presentation/dto/create-payment-intent.request';

@Controller('orders/:orderId/payments')
export class PaymentsController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post('intents')
	async createIntent(
		@Param('orderId') orderId: string,
		@Body() body: CreatePaymentIntentRequest,
	): Promise<CreatePaymentIntentResult> {
		return await this.commandBus.execute(
			new CreatePaymentIntentCommand({
				orderId,
				simulateOutcome: body.simulateOutcome,
				simulateDelaySeconds:
					body.simulateDelaySeconds !== undefined
						? Number(body.simulateDelaySeconds)
						: undefined,
			}),
		);
	}
}
