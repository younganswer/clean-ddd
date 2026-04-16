import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
	IOrderRepositorySymbol,
	type IOrderRepository,
} from '@/modules/ordering/domain/repositories/i.order.repository';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@CommandHandler(AttachPaymentToOrderCommand)
export class AttachPaymentToOrderHandler implements ICommandHandler<AttachPaymentToOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: AttachPaymentToOrderCommand): Promise<void> {
		const { orderId, paymentId } = command;

		await this.uow.transaction(async () => {
			const order = await this.orderRepository.getById(orderId);
			order.attachPayment(paymentId);
			await this.orderRepository.persist(order);
		});
	}
}
