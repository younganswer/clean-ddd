type InventoryReservationSchema = {
	uuid: string;
	orderId: string;
	sku: string;
	quantity: number;
};

export class InventoryReservationResult {
	constructor(
		public readonly reservationId: string,
		public readonly orderId: string,
		public readonly sku: string,
		public readonly quantity: number,
	) {}

	static fromSchema(
		schema: InventoryReservationSchema,
	): InventoryReservationResult {
		return new InventoryReservationResult(
			schema.uuid,
			schema.orderId,
			schema.sku,
			schema.quantity,
		);
	}
}
