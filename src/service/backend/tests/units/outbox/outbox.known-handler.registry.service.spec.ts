import { DiscoveryService, Reflector } from '@nestjs/core';
import { OutboxKnownHandler } from '@/common/outbox/outbox-known-handler.decorator';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { PAYMENT_WEBHOOK_FAILED_EVENT_TYPE } from '@/contracts/payments/events/payment-webhook-failed.event';

describe('OutboxKnownHandlerRegistryService', () => {
	it('registers handlers discovered via metadata', () => {
		@OutboxKnownHandler(PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE)
		class AlphaHandler {
			handle(): Promise<void> {
				return Promise.resolve();
			}
		}

		const alpha = new AlphaHandler();
		const discovery = {
			getProviders: jest.fn(() => [
				{ metatype: AlphaHandler, instance: alpha },
			]),
		} as unknown as DiscoveryService;
		const registry = new OutboxKnownHandlerRegistryService(
			discovery,
			new Reflector(),
		);

		registry.onModuleInit();

		const found = registry.find(PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE);
		expect(found?.handlerName).toBe('AlphaHandler');
		expect(found?.handler).toBe(alpha);
	});

	it('fails fast when eventType has duplicate handlers', () => {
		@OutboxKnownHandler(PAYMENT_WEBHOOK_FAILED_EVENT_TYPE)
		class FirstHandler {
			handle(): Promise<void> {
				return Promise.resolve();
			}
		}

		@OutboxKnownHandler(PAYMENT_WEBHOOK_FAILED_EVENT_TYPE)
		class SecondHandler {
			handle(): Promise<void> {
				return Promise.resolve();
			}
		}

		const discovery = {
			getProviders: jest.fn(() => [
				{ metatype: FirstHandler, instance: new FirstHandler() },
				{ metatype: SecondHandler, instance: new SecondHandler() },
			]),
		} as unknown as DiscoveryService;
		const registry = new OutboxKnownHandlerRegistryService(
			discovery,
			new Reflector(),
		);

		expect(() => registry.onModuleInit()).toThrow(
			'duplicate outbox handler registration',
		);
	});
});
