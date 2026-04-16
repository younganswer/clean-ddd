import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { assertOrderResult } from '@/modules/ordering/domain/readers/order-result.guard';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domain/readers/i.order.reader';
import { type InventoryOrderItemPayload } from '@/contracts/inventory/events/reserve-inventory-for-order-requested.event';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { ReleaseInventoryForOrderCommand } from '@/modules/inventory/application/commands/release-inventory-for-order.command';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { PaymentApplicationOrderItemsRequiredForInventoryReservationException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';

@Injectable()
@EventsHandler(PaymentFulfillmentRequestedEvent)
@OutboxKnownHandler(PaymentFulfillmentRequestedEvent.eventType)
export class PaymentFulfillmentRequestedHandler implements IEventHandler<PaymentFulfillmentRequestedEvent> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		private readonly commandBus: CommandBus,
	) {}

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
				PaymentApplicationOrderItemsRequiredForInventoryReservationException;
			const options = { cause: { orderId: event.orderId } };
			throw ApplicationExceptionFactory.create(template, options);
		}

		const reserveInventoryForOrderCommand =
			new ReserveInventoryForOrderCommand({
				orderId: event.orderId,
				items,
			});
		await this.commandBus.execute(reserveInventoryForOrderCommand);

		try {
			const createShipmentCommand = new CreateShipmentForOrderCommand({
				orderId: event.orderId,
			});
			await this.commandBus.execute(createShipmentCommand);
		} catch (error) {
			try {
				await this.commandBus.execute(
					new ReleaseInventoryForOrderCommand({
						orderId: event.orderId,
					}),
				);
			} catch (compensationError) {
				const resolve = (value: unknown): string => {
					if (value instanceof Error && value.message) {
						return value.message;
					}
					return String(value);
				};

				throw new Error(
					`shipment creation failed and compensation failed: original=${resolve(error)} compensation=${resolve(compensationError)}`,
				);
			}

			throw error;
		}
	}
}
