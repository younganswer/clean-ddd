export class ListOrdersQuery {
	constructor(
		public readonly limit: number,
		public readonly page: number = 1,
	) {}
}
