import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IOrderPaymentSnapshotReaderSymbol,
	type IOrderPaymentSnapshotReader,
} from '@/shared/ordering/readers/i.order-payment-snapshot.reader';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { OrderPaymentSnapshotResult } from '@/shared/ordering/readers/order-payment-snapshot.result';

@Injectable()
export class OrderPaymentSnapshotReader implements IOrderPaymentSnapshotReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async getByOrderId(orderId: string): Promise<OrderPaymentSnapshotResult> {
		const order = await this.emForContext().findOneOrFail(
			OrderSchema,
			{ uuid: orderId },
			{
				failHandler: () =>
					ApplicationErrorFactory.create(
						ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
						{ details: { id: orderId } },
					),
			},
		);

		return OrderPaymentSnapshotResult.fromSchema(order);
	}
}

export const OrderPaymentSnapshotReaderProvider = {
	provide: IOrderPaymentSnapshotReaderSymbol,
	useClass: OrderPaymentSnapshotReader,
};
