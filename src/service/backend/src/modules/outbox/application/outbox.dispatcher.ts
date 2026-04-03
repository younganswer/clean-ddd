import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { GetPendingOutboxEventsQuery } from '@/modules/outbox/application/queries/get-pending-outbox-events.query';

type PendingOutboxDispatchEvent = {
	id: string;
	eventType: string;
	payload: Record<string, unknown>;
	recordedAt: Date;
	nextAttemptAt: Date;
};

@Injectable()
export class OutboxDispatcher {
	constructor(
		private readonly orm: MikroORM,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	private async loadPendingEvents(
		limit: number,
		now: Date,
	): Promise<PendingOutboxDispatchEvent[]> {
		return await RequestContext.create(this.orm.em.fork(), async () => {
			const query = new GetPendingOutboxEventsQuery({ limit, now });
			const result = await this.queryBus.execute(query);
			return result.events.map((event) => ({
				id: event.id,
				eventType: event.eventType,
				payload: event.payload,
				recordedAt: event.recordedAt,
				nextAttemptAt: event.nextAttemptAt,
			}));
		});
	}

	private getStringValue(
		payload: Record<string, unknown>,
		key: string,
	): string | undefined {
		const value = payload[key];
		if (typeof value !== 'string') return undefined;
		const normalized = value.trim();
		return normalized ? normalized : undefined;
	}

	private getMessageGroupId(
		eventType: string,
		payload: Record<string, unknown>,
	): string {
		const candidates = [
			['order', 'orderId'],
			['payment', 'paymentId'],
			['shipment', 'shipmentId'],
			['inventory', 'inventoryItemId'],
			['inventory', 'sku'],
		] as const;

		for (const [domain, key] of candidates) {
			const value = this.getStringValue(payload, key);
			if (value) return `${domain}:${value}`;
		}

		return `event:${eventType}`;
	}

	private async dispatchSingleEvent(
		event: PendingOutboxDispatchEvent,
	): Promise<boolean> {
		if (!event.id) return false;

		const messageGroupId = this.getMessageGroupId(
			event.eventType,
			event.payload,
		);

		await RequestContext.create(this.orm.em.fork(), async () => {
			const command = new DispatchOutboxEventCommand({
				outboxId: event.id,
				messageGroupId,
			});
			await this.commandBus.execute(command);
		});

		return true;
	}

	async dispatchPending(limit = 10, now = new Date()): Promise<number> {
		const pendingEvents = await this.loadPendingEvents(limit, now);

		let dispatched = 0;
		for (const event of pendingEvents) {
			const didDispatch = await this.dispatchSingleEvent(event);
			if (didDispatch) {
				dispatched += 1;
			}
		}
		void now;

		return dispatched;
	}
}
