import { Command } from '@nestjs/cqrs';
import type { CreatePaymentIntentResult } from '@/shared/payments/commands/create-payment-intent.command';

export type CreateCheckoutBffResult = {
	orderId: string;
	payment: CreatePaymentIntentResult;
};

type CreateCheckoutBffItemInput = {
	sku: string;
	quantity: number;
};

export class CreateCheckoutBffCommand extends Command<CreateCheckoutBffResult> {
	public readonly userId: string;
	public readonly amount: number;
	public readonly currency: string;
	public readonly items?: CreateCheckoutBffItemInput[];
	public readonly simulateOutcome: 'SUCCEEDED' | 'FAILED';
	public readonly simulateDelaySeconds: number;

	constructor(input: {
		userId: string;
		amount: number;
		currency: string;
		items?: CreateCheckoutBffItemInput[];
		simulateOutcome?: 'SUCCEEDED' | 'FAILED';
		simulateDelaySeconds?: number;
	}) {
		super();
		this.userId = input.userId;
		this.amount = input.amount;
		this.currency = input.currency;
		this.items = input.items;
		this.simulateOutcome = input.simulateOutcome || 'SUCCEEDED';
		this.simulateDelaySeconds = input.simulateDelaySeconds || 10;
	}
}
