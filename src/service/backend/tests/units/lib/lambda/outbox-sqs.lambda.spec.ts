import { AppModule } from '@/app.module';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxConsumerModule } from '@/modules/outbox/outbox-consumer.module';

const createApplicationContextMock = jest.fn();

jest.mock('@/app.module', () => ({
	AppModule: class AppModule {},
}));

jest.mock('@/modules/outbox/application/outbox.consumer', () => ({
	OutboxConsumer: class OutboxConsumer {},
}));

jest.mock('@/modules/outbox/outbox-consumer.module', () => ({
	OutboxConsumerModule: class OutboxConsumerModule {},
}));

jest.mock('@nestjs/core', () => ({
	NestFactory: {
		createApplicationContext: createApplicationContextMock,
	},
}));

describe('outbox sqs lambda', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('resolves OutboxConsumer from OutboxConsumerModule context', async () => {
		const consumer = {
			consumeRawMessage: jest.fn().mockResolvedValue(undefined),
		};
		const get = jest.fn().mockReturnValue(consumer);
		const select = jest.fn().mockReturnValue({ get });

		createApplicationContextMock.mockResolvedValue({
			select,
		} as never);

		const lambdaModule = jest.requireActual<
			typeof import('../../../../src/lib/lambda/sqs/outbox')
		>('../../../../src/lib/lambda/sqs/outbox');

		await lambdaModule.handler(
			{
				Records: [{ body: '{"outboxId":"evt-1"}' }],
			} as never,
			{} as never,
			{} as never,
		);

		expect(createApplicationContextMock).toHaveBeenCalledWith(
			AppModule,
			expect.objectContaining({
				logger: ['log', 'warn', 'error'],
			}),
		);
		expect(select).toHaveBeenCalledWith(OutboxConsumerModule);
		expect(get).toHaveBeenCalledWith(OutboxConsumer, {
			strict: true,
		});
		expect(consumer.consumeRawMessage).toHaveBeenCalledWith({
			body: '{"outboxId":"evt-1"}',
		});
	});
});
