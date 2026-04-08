import { Logger } from '@nestjs/common';
import { AppModule } from '@/bootstrap/app.module';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { OutboxModule } from '@/modules/outbox/outbox.module';

const createApplicationContextMock = jest.fn();

jest.mock('@/bootstrap/app.module', () => ({
	AppModule: class AppModule {},
}));

jest.mock('@/modules/outbox/application/outbox.dispatcher', () => ({
	OutboxDispatcher: class OutboxDispatcher {},
}));

jest.mock('@/modules/outbox/outbox.module', () => ({
	OutboxModule: class OutboxModule {},
}));

jest.mock('@nestjs/core', () => ({
	NestFactory: {
		createApplicationContext: createApplicationContextMock,
	},
}));

describe('outbox dispatch lambda', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('resolves OutboxDispatcher from OutboxModule context', async () => {
		const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
		const dispatcher = {
			dispatchPending: jest.fn().mockResolvedValue(1),
		};
		const get = jest.fn().mockReturnValue(dispatcher);
		const select = jest.fn().mockReturnValue({ get });

		createApplicationContextMock.mockResolvedValue({
			select,
		} as never);

		const lambdaModule = jest.requireActual<
			typeof import('../../../../src/lib/lambda/schedule/outbox-dispatch')
		>('../../../../src/lib/lambda/schedule/outbox-dispatch');

		await lambdaModule.handler({} as never, {} as never, {} as never);

		expect(createApplicationContextMock).toHaveBeenCalledWith(
			AppModule,
			expect.objectContaining({
				logger: ['log', 'warn', 'error'],
			}),
		);
		expect(select).toHaveBeenCalledWith(OutboxModule);
		expect(get).toHaveBeenCalledWith(OutboxDispatcher, {
			strict: true,
		});
		expect(dispatcher.dispatchPending).toHaveBeenCalledWith(
			10,
			expect.any(Date),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('outbox_dispatch_invoked'),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining('outbox_dispatch_completed'),
		);
		logSpy.mockRestore();
	});
});
