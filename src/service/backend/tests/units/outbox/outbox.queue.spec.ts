import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';

describe('OutboxQueue', () => {
	it('includes enqueue source in SQS message body', async () => {
		let capturedCommand: SendMessageCommand | undefined;
		const sendMock = jest.fn((command: SendMessageCommand) => {
			capturedCommand = command;
			return Promise.resolve(undefined);
		});
		const queue = new OutboxQueue(
			{ send: sendMock } as unknown as SQSClient,
			'https://sqs.ap-northeast-2.amazonaws.com/123/outbox.fifo',
		);

		await queue.enqueue('outbox-1', {
			messageGroupId: 'order:order-1',
			source: OutboxDispatchSource.DISPATCHER,
		});

		expect(sendMock).toHaveBeenCalledTimes(1);
		expect(capturedCommand).toBeInstanceOf(SendMessageCommand);
		if (!capturedCommand) {
			throw new Error('expected SendMessageCommand');
		}
		const input = capturedCommand.input;

		expect(input.MessageBody).toBe(
			JSON.stringify({
				schemaVersion: 1,
				outboxId: 'outbox-1',
				source: OutboxDispatchSource.DISPATCHER,
			}),
		);
		expect(input.MessageGroupId).toBe('order:order-1');
		expect(input.MessageDeduplicationId).toBe('outbox-1');
	});
});
