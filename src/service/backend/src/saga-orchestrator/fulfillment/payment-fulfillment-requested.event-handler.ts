import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { assertOrderResult } from '@/modules/ordering/domains/readers/order-result.guard';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domains/readers/i.order.reader';
import { type InventoryOrderItemPayload } from '@/contracts/inventory/events/reserve-inventory-for-order-requested.event';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { LogAsyncExecution } from '@/common/logging/log-async-execution.decorator';
import { writeStructuredLog } from '@/common/logging/structured-log';

@Injectable()
@EventsHandler(PaymentFulfillmentRequestedEvent)
@OutboxKnownHandler(PaymentFulfillmentRequestedEvent.eventType)
export class PaymentFulfillmentRequestedHandler implements IEventHandler<PaymentFulfillmentRequestedEvent> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		private readonly commandBus: CommandBus,
	) {}

	@LogAsyncExecution<[PaymentFulfillmentRequestedEvent], void>({
		started: {
			step: 'payment_fulfillment_requested_received',
			getPayload: ([event]) => ({ orderId: event.orderId }),
		},
	})
	async handle(event: PaymentFulfillmentRequestedEvent): Promise<void> {
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

		await this.commandBus.execute(
			new ReserveInventoryForOrderCommand({
				orderId: event.orderId,
				items,
			}),
		);
		writeStructuredLog(PaymentFulfillmentRequestedHandler.name, {
			step: 'inventory_reservation_requested_via_command_bus',
			orderId: event.orderId,
			itemCount: items.length,
		});

		await this.commandBus.execute(
			new CreateShipmentForOrderCommand({
				orderId: event.orderId,
			}),
		);
		writeStructuredLog(PaymentFulfillmentRequestedHandler.name, {
			step: 'shipment_creation_requested_via_command_bus',
			orderId: event.orderId,
		});
	}
}
