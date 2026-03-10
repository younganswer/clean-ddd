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
import { OUTBOX_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';
import { writeStructuredLog } from '@/common/logging/structured-log';

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
				throw InfrastructureErrorFactory.create(
					OUTBOX_INFRA_ERRORS.OUTBOX_HANDLER_INVALID,
					{
						message: `unknown outbox eventType=${eventType}`,
						details: { eventType, handler: metatype.name },
					},
				);
			}

			if (
				typeof (provider.instance as { handle?: unknown }).handle !==
				'function'
			) {
				throw InfrastructureErrorFactory.create(
					OUTBOX_INFRA_ERRORS.OUTBOX_HANDLER_INVALID,
					{
						message: `${metatype.name} does not implement handle(event)`,
						details: { eventType, handler: metatype.name },
					},
				);
			}

			if (this.handlersByEventType.has(eventType)) {
				const existing = this.handlersByEventType.get(eventType);
				throw InfrastructureErrorFactory.create(
					OUTBOX_INFRA_ERRORS.OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE,
					{
						message: `duplicate outbox handler registration for eventType=${eventType}`,
						details: {
							eventType,
							existingHandler: existing?.handlerName,
							handler: metatype.name,
						},
					},
				);
			}

			this.handlersByEventType.set(eventType, {
				eventType,
				handlerName: metatype.name,
				handler: provider.instance as OutboxKnownEventHandler,
			});
		}

		if (this.handlersByEventType.size > 0) {
			writeStructuredLog(OutboxKnownHandlerRegistryService.name, {
				step: 'outbox_known_handlers_registered',
				handlerCount: this.handlersByEventType.size,
			});
		}
	}

	find(eventType: string): OutboxKnownHandlerEntry | undefined {
		if (!isKnownOutboxEventType(eventType)) {
			return undefined;
		}

		return this.handlersByEventType.get(eventType);
	}
}
