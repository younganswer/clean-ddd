import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { GetPendingOutboxEventsQuery } from '@/modules/outbox/application/queries/get-pending-outbox-events.query';

@Injectable()
export class OutboxDispatcher {
	private readonly logger = new Logger(OutboxDispatcher.name);

	constructor(
		private readonly orm: MikroORM,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async dispatchPending(limit = 10, now = new Date()): Promise<number> {
		const pendingEvents = await RequestContext.create(
			this.orm.em.fork(),
			async () => {
				const result = await this.queryBus.execute(
					new GetPendingOutboxEventsQuery({ limit, now }),
				);
				return result.events.map((event) => ({
					id: event.id,
					eventType: event.eventType,
					payload: event.payload,
				}));
			},
		);

		const getStringValue = (
			payload: Record<string, unknown>,
			key: string,
		): string | undefined => {
			const value = payload[key];
			if (typeof value !== 'string') return undefined;
			const normalized = value.trim();
			return normalized ? normalized : undefined;
		};

		const getMessageGroupId = (
			eventType: string,
			payload: Record<string, unknown>,
		): string => {
			const candidates = [
				['order', 'orderId'],
				['payment', 'paymentId'],
				['shipment', 'shipmentId'],
				['inventory', 'inventoryItemId'],
				['inventory', 'sku'],
			] as const;

			for (const [domain, key] of candidates) {
				const value = getStringValue(payload, key);
				if (value) return `${domain}:${value}`;
			}

			return `event:${eventType}`;
		};

		let dispatched = 0;
		for (const event of pendingEvents) {
			if (!event.id) continue;

			const messageGroupId = getMessageGroupId(
				event.eventType,
				event.payload,
			);

			await RequestContext.create(this.orm.em.fork(), async () => {
				await this.commandBus.execute(
					new DispatchOutboxEventCommand({
						outboxId: event.id,
						messageGroupId,
					}),
				);
			});
			dispatched += 1;
		}

		if (dispatched > 0) {
			this.logger.log(`dispatched=${dispatched}`);
		}

		return dispatched;
	}
}
