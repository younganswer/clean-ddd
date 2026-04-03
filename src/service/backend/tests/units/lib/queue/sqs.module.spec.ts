import { Test } from '@nestjs/testing';
import { CreateQueueCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import { SqsModule, SQS_OUTBOX_QUEUE_URL } from '@/lib/queue/sqs.module';

type SqsSendMock = jest.Mock<Promise<unknown>, [unknown]>;
const mockSend: SqsSendMock = jest.fn<Promise<unknown>, [unknown]>();

jest.mock('@aws-sdk/client-sqs', () => {
	class GetQueueUrlCommand {
		constructor(public readonly input: unknown) {}
	}

	class CreateQueueCommand {
		constructor(public readonly input: unknown) {}
	}

	class SQSClient {
		constructor(public readonly config: unknown) {}

		send = mockSend;
	}

	return {
		CreateQueueCommand,
		GetQueueUrlCommand,
		SQSClient,
	};
});
const ORIGINAL_ENV = process.env;

describe('SqsModule', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...ORIGINAL_ENV };
		delete process.env.SQS_ENDPOINT;
		delete process.env.SQS_OUTBOX_QUEUE_NAME;
		delete process.env.SQS_OUTBOX_QUEUE_URL;
		delete process.env.AWS_REGION;
		delete process.env.AWS_ACCESS_KEY_ID;
		delete process.env.AWS_SECRET_ACCESS_KEY;
		delete process.env.AWS_SESSION_TOKEN;
	});

	afterAll(() => {
		process.env = ORIGINAL_ENV;
	});

	it('resolves queue url via GetQueueUrl when endpoint lookup succeeds', async () => {
		process.env.SQS_ENDPOINT = 'http://localhost:4566';
		process.env.SQS_OUTBOX_QUEUE_NAME = 'OutboxDispatchQueue.fifo';
		mockSend.mockResolvedValueOnce({
			QueueUrl:
				'http://localhost:4566/000000000000/OutboxDispatchQueue.fifo',
		});

		const moduleRef = await Test.createTestingModule({
			imports: [SqsModule],
		}).compile();

		const queueUrl = moduleRef.get<string>(SQS_OUTBOX_QUEUE_URL);

		expect(queueUrl).toBe(
			'http://localhost:4566/000000000000/OutboxDispatchQueue.fifo',
		);
		expect(mockSend).toHaveBeenCalledTimes(1);
		const firstCallCommand = mockSend.mock.calls[0]?.[0];
		expect(firstCallCommand).toBeInstanceOf(GetQueueUrlCommand);

		await moduleRef.close();
	});

	it('creates queue on local endpoint when initial lookup fails', async () => {
		process.env.SQS_ENDPOINT = 'http://localhost:4566';
		process.env.SQS_OUTBOX_QUEUE_NAME = 'OutboxDispatchQueue.fifo';

		mockSend
			.mockRejectedValueOnce(new Error('missing queue'))
			.mockResolvedValueOnce({})
			.mockResolvedValueOnce({
				QueueUrl:
					'http://localhost:4566/000000000000/OutboxDispatchQueue.fifo',
			});

		const moduleRef = await Test.createTestingModule({
			imports: [SqsModule],
		}).compile();

		const queueUrl = moduleRef.get<string>(SQS_OUTBOX_QUEUE_URL);

		expect(queueUrl).toBe(
			'http://localhost:4566/000000000000/OutboxDispatchQueue.fifo',
		);
		expect(mockSend).toHaveBeenCalledTimes(3);
		const firstCallCommand = mockSend.mock.calls[0]?.[0];
		const secondCallCommand = mockSend.mock.calls[1]?.[0];
		const thirdCallCommand = mockSend.mock.calls[2]?.[0];
		expect(firstCallCommand).toBeInstanceOf(GetQueueUrlCommand);
		expect(secondCallCommand).toBeInstanceOf(CreateQueueCommand);
		expect(thirdCallCommand).toBeInstanceOf(GetQueueUrlCommand);

		if (!(secondCallCommand instanceof CreateQueueCommand)) {
			throw new Error('expected CreateQueueCommand');
		}
		expect(secondCallCommand.input).toMatchObject({
			QueueName: 'OutboxDispatchQueue.fifo',
			Attributes: {
				FifoQueue: 'true',
				ContentBasedDeduplication: 'false',
			},
		});

		await moduleRef.close();
	});

	it('normalizes localstack host when queue url is provided without endpoint', async () => {
		process.env.SQS_OUTBOX_QUEUE_URL =
			'http://localstack:4566/000000000000/OutboxDispatchQueue.fifo';

		const moduleRef = await Test.createTestingModule({
			imports: [SqsModule],
		}).compile();

		const queueUrl = moduleRef.get<string>(SQS_OUTBOX_QUEUE_URL);

		expect(queueUrl).toBe(
			'http://localhost:4566/000000000000/OutboxDispatchQueue.fifo',
		);
		expect(mockSend).not.toHaveBeenCalled();

		await moduleRef.close();
	});
});
