import {
	createOutboxDispatchMessage,
	parseOutboxDispatchMessage,
	serializeOutboxDispatchMessage,
} from '@/shared/outbox/domain/queue/outbox-dispatch-message';
import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';

describe('outbox dispatch message', () => {
	it('serializes queue messages with explicit source', () => {
		expect(
			createOutboxDispatchMessage({
				outboxId: 'outbox-1',
				source: OutboxDispatchSource.DISPATCHER,
			}),
		).toEqual({
			schemaVersion: 1,
			outboxId: 'outbox-1',
			source: OutboxDispatchSource.DISPATCHER,
		});

		expect(
			serializeOutboxDispatchMessage({
				outboxId: 'outbox-1',
				source: OutboxDispatchSource.DISPATCHER,
			}),
		).toBe(
			JSON.stringify({
				schemaVersion: 1,
				outboxId: 'outbox-1',
				source: OutboxDispatchSource.DISPATCHER,
			}),
		);
	});

	it('normalizes missing source to legacy', () => {
		expect(
			parseOutboxDispatchMessage(
				JSON.stringify({ outboxId: 'outbox-1' }),
			),
		).toEqual({
			ok: true,
			message: {
				outboxId: 'outbox-1',
				source: OutboxDispatchSource.LEGACY,
			},
		});
	});

	it('returns parse errors for invalid message bodies', () => {
		expect(parseOutboxDispatchMessage('{')).toEqual({
			ok: false,
			reason: 'invalid-json',
		});

		expect(
			parseOutboxDispatchMessage(
				JSON.stringify({ source: OutboxDispatchSource.DISPATCHER }),
			),
		).toEqual({
			ok: false,
			reason: 'missing-outbox-id',
		});
	});
});
