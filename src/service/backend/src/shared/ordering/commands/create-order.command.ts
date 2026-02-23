export class CreateOrderCommand {
	constructor(
		public readonly input: {
			userId: string;
			amount: number;
			currency: string;
			items?: Array<{ sku: string; quantity: number }>;
		},
	) {}
}
