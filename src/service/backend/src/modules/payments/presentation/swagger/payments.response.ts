import { ApiProperty } from '@nestjs/swagger';
import type { PaymentIntentResult } from '@/modules/payments/domain/readers/payment-intent.result';
import type { CreatePaymentIntentResult } from '@/modules/payments/application/commands/create-payment-intent.command';
import { MoneyResponse } from '@/shared/money/presentation/swagger/money.response';

export class PaymentIntentResponse {
	@ApiProperty()
	paymentId!: string;

	@ApiProperty()
	orderId!: string;

	@ApiProperty({ type: MoneyResponse })
	money!: MoneyResponse;

	@ApiProperty()
	status!: string;

	static fromResult(result: PaymentIntentResult): PaymentIntentResponse {
		return {
			paymentId: result.paymentId,
			orderId: result.orderId,
			money: MoneyResponse.fromAmountMinor(
				result.amount,
				result.currency,
			),
			status: String(result.status),
		};
	}

	static fromResults(
		results: PaymentIntentResult[],
	): PaymentIntentResponse[] {
		return results.map((result) =>
			PaymentIntentResponse.fromResult(result),
		);
	}
}

export class ScheduledPaymentEventResponse {
	@ApiProperty()
	eventType!: string;

	@ApiProperty()
	delaySeconds!: number;

	@ApiProperty()
	outboxId!: string;

	static fromResult(
		result: CreatePaymentIntentResult['scheduled'],
	): ScheduledPaymentEventResponse {
		return {
			eventType: result.eventType,
			delaySeconds: result.delaySeconds,
			outboxId: result.outboxId,
		};
	}
}

export class CreatePaymentIntentResponse {
	@ApiProperty()
	paymentId!: string;

	@ApiProperty()
	status!: string;

	@ApiProperty({ type: ScheduledPaymentEventResponse })
	scheduled!: ScheduledPaymentEventResponse;

	static fromResult(
		result: CreatePaymentIntentResult,
	): CreatePaymentIntentResponse {
		return {
			paymentId: result.paymentId,
			status: String(result.status),
			scheduled: ScheduledPaymentEventResponse.fromResult(
				result.scheduled,
			),
		};
	}
}
