import { SetMetadata } from '@nestjs/common';

export const OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA =
	'outbox:known-handler:event-type';

export interface OutboxKnownEventHandler {
	handle(event: object): Promise<void>;
}

export const OutboxKnownHandler = (eventType: string): ClassDecorator =>
	SetMetadata(OUTBOX_KNOWN_HANDLER_EVENT_TYPE_METADATA, eventType);
