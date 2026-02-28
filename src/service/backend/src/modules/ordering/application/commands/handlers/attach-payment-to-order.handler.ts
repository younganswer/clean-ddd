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
		if (!orderId) {
			throw ApplicationErrorFactory.create(
				ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
			);
		}
		if (!paymentId) {
			throw ApplicationErrorFactory.create(
				ORDERING_APPLICATION_ERRORS.PAYMENT_ID_REQUIRED,
			);
		}

		await this.uow.transaction(async () => {
			const order = await this.orderRepository.findById(orderId);
			if (!order) {
				throw ApplicationErrorFactory.create(
					ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
					{
						details: { orderId },
					},
				);
			}

			order.attachPayment(paymentId);
			await this.orderRepository.persist(order);
		});
	}
}
