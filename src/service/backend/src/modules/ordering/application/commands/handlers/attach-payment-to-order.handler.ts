import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
	IOrderRepositorySymbol,
	type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@CommandHandler(AttachPaymentToOrderCommand)
export class AttachPaymentToOrderHandler implements ICommandHandler<AttachPaymentToOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: AttachPaymentToOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		const paymentId = String(command.input.paymentId ?? '').trim();
		if (!orderId || !paymentId) {
			const template = orderId
				? ORDERING_APPLICATION_ERRORS.PAYMENT_ID_REQUIRED
				: ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED;
			throw ApplicationErrorFactory.create(template);
		}

		await this.uow.transaction(async () => {
			const order = await this.orderRepository.findById(orderId);
			if (!order) {
				const template = ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND;
				const options = { details: { orderId } };
				throw ApplicationErrorFactory.create(template, options);
			}

			order.attachPayment(paymentId);
			await this.orderRepository.persist(order);
		});
	}
}
