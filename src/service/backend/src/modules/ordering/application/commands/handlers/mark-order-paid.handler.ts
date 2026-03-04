import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
	IOrderRepositorySymbol,
	type IOrderRepository,
} from '@/modules/ordering/domains/repositories/i.order.repository';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@CommandHandler(MarkOrderPaidCommand)
export class MarkOrderPaidHandler implements ICommandHandler<MarkOrderPaidCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: MarkOrderPaidCommand): Promise<void> {
		const { orderId } = command;

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

			order.markPaid();
			await this.orderRepository.persist(order);
		});
	}
}
