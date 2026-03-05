import { Command } from '@nestjs/cqrs';

export type CreateOrderBffItemInput = {
	sku: string;
	quantity: number;
};

export type CreateOrderBffBodyInput = {
	userId: string;
	amount: number;
	currency: string;
	items?: CreateOrderBffItemInput[];
};

export class CreateOrderBffCommand extends Command<{ orderId: string }> {
	constructor(public readonly input: { body: CreateOrderBffBodyInput }) {
		super();
	}
}
