import { Command } from '@nestjs/cqrs';

export type CreateShipmentForOrderResult = {
	shipmentId: string;
};

export class CreateShipmentForOrderCommand extends Command<CreateShipmentForOrderResult> {
	constructor(public readonly orderId: string) {
		super();
	}
}
