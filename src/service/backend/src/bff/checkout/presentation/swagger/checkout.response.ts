import { ApiProperty } from '@nestjs/swagger';
import { CreatePaymentIntentResponse } from '@/modules/payments/presentation/swagger/payments.response';
import type { CreateCheckoutBffResult } from '@/bff/checkout/application/commands/create-checkout-bff.command';

export class CreateCheckoutBffResponse {
	@ApiProperty()
	orderId!: string;

	@ApiProperty({ type: CreatePaymentIntentResponse })
	payment!: CreatePaymentIntentResponse;

	static fromResult(
		result: CreateCheckoutBffResult,
	): CreateCheckoutBffResponse {
		return {
			orderId: result.orderId,
			payment: CreatePaymentIntentResponse.fromResult(result.payment),
		};
	}
}
