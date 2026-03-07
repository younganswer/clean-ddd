import { Injectable, Logger } from '@nestjs/common';
import {
	CommandBus,
	EventsHandler,
	IEventHandler,
	QueryBus,
} from '@nestjs/cqrs';
import { assertOrderResult } from '@/shared/ordering/readers/order-result.guard';
import {
	ReserveInventoryForOrderCommand,
	type InventoryOrderItemPayload,
} from '@/shared/inventory';
import { CreateShipmentForOrderCommand } from '@/shared/shipping/commands/create-shipment-for-order.command';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { OutboxKnownHandler } from '@/modules/outbox/application/outbox-known-handler.decorator';
import { PaymentFulfillmentRequestedEvent } from '@/shared/payments';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';

@Injectable()
@EventsHandler(PaymentFulfillmentRequestedEvent)
@OutboxKnownHandler(PaymentFulfillmentRequestedEvent.eventType)
export class PaymentFulfillmentRequestedHandler implements IEventHandler<PaymentFulfillmentRequestedEvent> {
	private readonly logger = new Logger(
		PaymentFulfillmentRequestedHandler.name,
	);

	constructor(
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async handle(event: PaymentFulfillmentRequestedEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_fulfillment_requested_received',
				orderId: event.orderId,
			}),
		);

		const order = await this.queryBus.execute(
			new GetOrderQuery({ orderId: event.orderId }),
		);
		assertOrderResult(order);

		const items: InventoryOrderItemPayload[] = order.items.length
			? order.items.map(({ sku, quantity }) => ({
					sku,
					quantity,
				}))
			: [];

		if (!items.length) {
			const template =
				PAYMENTS_APPLICATION_ERRORS.ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION;
			const options = { details: { orderId: event.orderId } };
			throw ApplicationErrorFactory.create(template, options);
		}

		await this.commandBus.execute(
			new ReserveInventoryForOrderCommand({
				orderId: event.orderId,
				items,
			}),
		);
		this.logger.log(
			JSON.stringify({
				step: 'inventory_reservation_requested_via_command_bus',
				orderId: event.orderId,
				itemCount: items.length,
			}),
		);

		await this.commandBus.execute(
			new CreateShipmentForOrderCommand({
				orderId: event.orderId,
			}),
		);
		this.logger.log(
			JSON.stringify({
				step: 'shipment_creation_requested_via_command_bus',
				orderId: event.orderId,
			}),
		);
	}
}
