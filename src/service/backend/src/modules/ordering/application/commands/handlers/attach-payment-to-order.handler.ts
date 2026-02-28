import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
	IOrderRepositorySymbol,
	type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@CommandHandler(AttachPaymentToOrderCommand)
export class AttachPaymentToOrderHandler implements ICommandHandler<AttachPaymentToOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orders: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: AttachPaymentToOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		const paymentId = String(command.input.paymentId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');
		if (!paymentId) throw new Error('paymentId is required');

		await this.uow.transaction(async () => {
			const order = await this.orders.findById(orderId);
			if (!order) throw new Error('order not found');

			order.attachPayment(paymentId);
			await this.orders.persist(order);
		});
	}
}
