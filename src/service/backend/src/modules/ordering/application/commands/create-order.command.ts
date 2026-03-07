import { Command } from '@nestjs/cqrs';

export class CreateOrderCommand extends Command<{ orderId: string }> {
	public readonly userId: string;
	public readonly amount: number;
	public readonly currency: string;
	public readonly items?: Array<{ sku: string; quantity: number }>;

	constructor(input: {
		userId: string;
		amount: number;
		currency: string;
		items?: Array<{ sku: string; quantity: number }>;
	}) {
		super();
		this.userId = input.userId;
		this.amount = input.amount;
		this.currency = input.currency;
		this.items = input.items;
	}
}
