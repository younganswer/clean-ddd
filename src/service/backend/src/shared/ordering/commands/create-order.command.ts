import { Command } from '@nestjs/cqrs';

export class CreateOrderCommand extends Command<{ orderId: string }> {
	constructor(
		public readonly input: {
			userId: string;
			amount: number;
			currency: string;
			items?: Array<{ sku: string; quantity: number }>;
		},
	) {
		super();
	}
}
