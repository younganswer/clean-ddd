import { DiscoveryService, Reflector } from '@nestjs/core';
import { OutboxKnownHandler } from '@/modules/outbox/application/outbox-known-handler.decorator';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';

describe('OutboxKnownHandlerRegistryService', () => {
	it('registers handlers discovered via metadata', () => {
		@OutboxKnownHandler('event.alpha')
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

		const found = registry.find('event.alpha');
		expect(found?.handlerName).toBe('AlphaHandler');
		expect(found?.handler).toBe(alpha);
	});

	it('fails fast when eventType has duplicate handlers', () => {
		@OutboxKnownHandler('event.duplicate')
		class FirstHandler {
			handle(): Promise<void> {
				return Promise.resolve();
			}
		}

		@OutboxKnownHandler('event.duplicate')
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
