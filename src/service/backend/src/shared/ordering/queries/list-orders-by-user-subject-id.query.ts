export class ListOrdersByUserIdQuery {
	constructor(
		public readonly userId: string,
		public readonly limit: number = 200,
		public readonly offset: number = 0,
	) {}
}
