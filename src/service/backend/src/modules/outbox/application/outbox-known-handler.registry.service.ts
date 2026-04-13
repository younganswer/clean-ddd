import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import {
	OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA,
	type OutboxKnownEventHandler,
} from '@/lib/outbox/outbox-known-handler.decorator';
import {
	type OutboxEventType,
	isKnownOutboxEventType,
} from '@/lib/outbox/event-registry';
import {
	OutboxHandlerDuplicateEventTypeException,
	OutboxHandlerInvalidException,
} from '@/shared/exceptions';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';

type OutboxKnownHandlerEntry = {
	eventType: OutboxEventType;
	handlerName: string;
	handler: OutboxKnownEventHandler;
};

@Injectable()
export class OutboxKnownHandlerRegistryService implements OnModuleInit {
	private readonly handlersByEventType = new Map<
		string,
		OutboxKnownHandlerEntry
	>();

	constructor(
		private readonly discoveryService: DiscoveryService,
		private readonly reflector: Reflector,
	) {}

	onModuleInit(): void {
		const providers = this.discoveryService.getProviders();
		for (const provider of providers) {
			const metatype = provider.metatype;
			if (!metatype || !provider.instance) continue;

			const eventTypeValue = this.reflector.get<string>(
				OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA,
				metatype,
			);
			if (typeof eventTypeValue !== 'string' || !eventTypeValue.trim()) {
				continue;
			}
			const eventType = eventTypeValue.trim();
			if (!eventType) continue;
			if (!isKnownOutboxEventType(eventType)) {
				throw InfrastructureExceptionFactory.create(
					OutboxHandlerInvalidException,
					{
						cause: { eventType, handler: metatype.name },
						description: `unknown outbox eventType=${eventType}`,
					},
				);
			}

			if (
				typeof (provider.instance as { handle?: unknown }).handle !==
				'function'
			) {
				throw InfrastructureExceptionFactory.create(
					OutboxHandlerInvalidException,
					{
						cause: { eventType, handler: metatype.name },
						description: `${metatype.name} does not implement handle(event)`,
					},
				);
			}

			if (this.handlersByEventType.has(eventType)) {
				const existing = this.handlersByEventType.get(eventType);
				throw InfrastructureExceptionFactory.create(
					OutboxHandlerDuplicateEventTypeException,
					{
						cause: {
							eventType,
							existingHandler: existing?.handlerName,
							handler: metatype.name,
						},
						description: `duplicate outbox handler registration for eventType=${eventType}`,
					},
				);
			}

			this.handlersByEventType.set(eventType, {
				eventType,
				handlerName: metatype.name,
				handler: provider.instance as OutboxKnownEventHandler,
			});
		}

		void this.handlersByEventType.size;
	}

	find(eventType: string): OutboxKnownHandlerEntry | undefined {
		if (!isKnownOutboxEventType(eventType)) {
			return undefined;
		}

		return this.handlersByEventType.get(eventType);
	}
}
