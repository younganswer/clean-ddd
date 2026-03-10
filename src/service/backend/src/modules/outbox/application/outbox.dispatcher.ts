import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { GetPendingOutboxEventsQuery } from '@/modules/outbox/application/queries/get-pending-outbox-events.query';
import { writeStructuredLog } from '@/common/logging/structured-log';

@Injectable()
export class OutboxDispatcher {
	constructor(
		private readonly orm: MikroORM,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async dispatchPending(limit = 10, now = new Date()): Promise<number> {
		const startedAt = Date.now();
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
					recordedAt: event.recordedAt,
					nextAttemptAt: event.nextAttemptAt,
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
			const eventDispatchStartedAt = Date.now();

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
			writeStructuredLog(OutboxDispatcher.name, {
				step: 'outbox_dispatch_forwarded',
				outboxId: event.id,
				eventType: event.eventType,
				messageGroupId,
				dispatchLagMs: now.getTime() - event.recordedAt.getTime(),
				retryReadyLagMs: now.getTime() - event.nextAttemptAt.getTime(),
				forwardMs: Date.now() - eventDispatchStartedAt,
			});
			dispatched += 1;
		}

		if (dispatched > 0) {
			writeStructuredLog(OutboxDispatcher.name, {
				step: 'outbox_dispatch_batch_completed',
				dispatched,
				limit,
				totalMs: Date.now() - startedAt,
			});
		}

		return dispatched;
	}
}
