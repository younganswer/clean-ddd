import { Command } from '@nestjs/cqrs';
import type { CreatePaymentIntentResult } from '@/shared/payments/commands/create-payment-intent.command';

export type CreateCheckoutBffItemInput = {
	sku: string;
	quantity: number;
};

export type CreateCheckoutBffBodyInput = {
	userId: string;
	amount: number;
	currency: string;
	items?: CreateCheckoutBffItemInput[];
	simulateOutcome?: 'SUCCEEDED' | 'FAILED';
	simulateDelaySeconds?: number;
};

export type CreateCheckoutBffResult = {
	orderId: string;
	payment: CreatePaymentIntentResult;
};

export class CreateCheckoutBffCommand extends Command<CreateCheckoutBffResult> {
	constructor(
		public readonly input: {
			body: CreateCheckoutBffBodyInput;
		},
	) {
		super();
	}
}
