import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import {
	OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA,
	type OutboxKnownEventHandler,
} from '@/common/outbox/outbox-known-handler.decorator';
import { OUTBOX_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

type OutboxKnownHandlerEntry = {
	eventType: string;
	handlerName: string;
	handler: OutboxKnownEventHandler;
};

@Injectable()
export class OutboxKnownHandlerRegistryService implements OnModuleInit {
	private readonly logger = new Logger(
		OutboxKnownHandlerRegistryService.name,
	);
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
			this.logger.log(
				`registered outbox known handlers=${this.handlersByEventType.size}`,
			);
		}
	}

	find(eventType: string): OutboxKnownHandlerEntry | undefined {
		return this.handlersByEventType.get(eventType);
	}
}
