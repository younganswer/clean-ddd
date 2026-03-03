import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DispatchOutboxEventCommand } from '@/shared/outbox/commands/dispatch-outbox-event.command';
import {
	GetPendingOutboxEventsQuery,
	type GetPendingOutboxEventsResult,
} from '@/shared/outbox/queries/get-pending-outbox-events.query';

@Injectable()
export class OutboxDispatcher {
	private readonly logger = new Logger(OutboxDispatcher.name);

	constructor(
		private readonly orm: MikroORM,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async dispatchPending(limit = 10, now = new Date()): Promise<number> {
		return RequestContext.create(this.orm.em.fork(), async () => {
			const result = await this.queryBus.execute<
				GetPendingOutboxEventsQuery,
				GetPendingOutboxEventsResult
			>(new GetPendingOutboxEventsQuery(limit, now));

			const getOrderId = (
				payload: Record<string, unknown>,
			): string | undefined => {
				const value = payload['orderId'];
				return typeof value === 'string' && value.trim()
					? value.trim()
					: undefined;
			};

			let dispatched = 0;
			for (const event of result.events) {
				if (!event.id) continue;

				const messageGroupId = getOrderId(event.payload) ?? 'outbox';
				await this.commandBus.execute<DispatchOutboxEventCommand, void>(
					new DispatchOutboxEventCommand(event.id, messageGroupId),
				);
				dispatched += 1;
			}

			if (dispatched > 0) {
				this.logger.log(`dispatched=${dispatched}`);
			}

			return dispatched;
		});
	}
}
