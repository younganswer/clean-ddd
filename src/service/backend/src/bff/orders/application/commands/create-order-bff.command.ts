import { Command } from '@nestjs/cqrs';

type CreateOrderBffItemInput = {
	sku: string;
	quantity: number;
};

export class CreateOrderBffCommand extends Command<{ orderId: string }> {
	public readonly userId: string;
	public readonly amount: number;
	public readonly currency: string;
	public readonly items?: CreateOrderBffItemInput[];

	constructor(input: {
		userId: string;
		amount: number;
		currency: string;
		items?: CreateOrderBffItemInput[];
	}) {
		super();
		this.userId = input.userId;
		this.amount = input.amount;
		this.currency = input.currency;
		this.items = input.items;
	}
}
