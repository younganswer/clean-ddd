import { SetMetadata } from '@nestjs/common';
import type { OutboxEventType } from '@/lib/outbox/event-registry';

export const OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA =
	'outbox:known-handler:event-type';

export interface OutboxKnownEventHandler {
	handle(event: object): Promise<void>;
}

export const OutboxKnownHandler = (
	eventType: OutboxEventType,
): ClassDecorator =>
	SetMetadata(OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA, eventType);
