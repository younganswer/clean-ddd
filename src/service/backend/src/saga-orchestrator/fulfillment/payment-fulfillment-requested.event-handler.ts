import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { assertOrderResult } from '@/shared/ordering/readers/order-result.guard';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import {
	ReserveInventoryForOrderRequestedEvent,
	type InventoryOrderItemPayload,
} from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { OutboxKnownHandler } from '@/modules/outbox/application/outbox-known-handler.decorator';
import { PaymentFulfillmentRequestedEvent } from '@/shared/payments';

@Injectable()
@EventsHandler(PaymentFulfillmentRequestedEvent)
@OutboxKnownHandler(PaymentFulfillmentRequestedEvent.eventType)
export class PaymentFulfillmentRequestedHandler implements IEventHandler<PaymentFulfillmentRequestedEvent> {
	private readonly logger = new Logger(
		PaymentFulfillmentRequestedHandler.name,
	);

	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		private readonly outboxProducer: OutboxProducer,
	) {}

	async handle(event: PaymentFulfillmentRequestedEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_fulfillment_requested_received',
				orderId: event.orderId,
			}),
		);

		const order = await this.orderReader.findById(event.orderId);
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

		await this.outboxProducer.publish(
			new ReserveInventoryForOrderRequestedEvent({
				orderId: event.orderId,
				items,
			}),
			{ messageGroupId: event.orderId },
		);
		this.logger.log(
			JSON.stringify({
				step: 'inventory_reservation_requested_published',
				orderId: event.orderId,
				itemCount: items.length,
			}),
		);

		await this.outboxProducer.publish(
			new CreateShipmentForOrderRequestedEvent({
				orderId: event.orderId,
			}),
			{ messageGroupId: event.orderId },
		);
		this.logger.log(
			JSON.stringify({
				step: 'shipment_creation_requested_published',
				orderId: event.orderId,
			}),
		);
	}
}
