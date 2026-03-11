import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';

export type OutboxEnqueueSource = Exclude<
	OutboxDispatchSource,
	OutboxDispatchSource.LEGACY
>;

export interface OutboxDispatchMessage {
	schemaVersion: 1;
	outboxId: string;
	source?: OutboxEnqueueSource;
}

export interface NormalizedOutboxDispatchMessage {
	outboxId: string;
	source: OutboxDispatchSource;
}

export type ParseOutboxDispatchMessageResult =
	| {
			ok: true;
			message: NormalizedOutboxDispatchMessage;
	  }
	| {
			ok: false;
			reason: 'invalid-json' | 'missing-outbox-id';
	  };

export function createOutboxDispatchMessage(input: {
	outboxId: string;
	source?: OutboxEnqueueSource;
}): OutboxDispatchMessage {
	return {
		schemaVersion: 1,
		outboxId: input.outboxId,
		...(input.source ? { source: input.source } : {}),
	};
}

export function serializeOutboxDispatchMessage(input: {
	outboxId: string;
	source?: OutboxEnqueueSource;
}): string {
	return JSON.stringify(createOutboxDispatchMessage(input));
}

export function parseOutboxDispatchMessage(
	body: string,
): ParseOutboxDispatchMessageResult {
	try {
		const parsed = JSON.parse(body) as {
			outboxId?: string;
			source?: string;
		};

		if (!parsed.outboxId) {
			return {
				ok: false,
				reason: 'missing-outbox-id',
			};
		}

		return {
			ok: true,
			message: {
				outboxId: parsed.outboxId,
				source: normalizeOutboxDispatchSource(parsed.source),
			},
		};
	} catch {
		return {
			ok: false,
			reason: 'invalid-json',
		};
	}
}

function normalizeOutboxDispatchSource(
	source: string | undefined,
): OutboxDispatchSource {
	if (source === OutboxDispatchSource.DISPATCHER) {
		return OutboxDispatchSource.DISPATCHER;
	}
	if (source === OutboxDispatchSource.SWEEPER) {
		return OutboxDispatchSource.SWEEPER;
	}
	if (source === OutboxDispatchSource.SWEEPER_DIRECT) {
		return OutboxDispatchSource.SWEEPER_DIRECT;
	}

	return OutboxDispatchSource.LEGACY;
}
