export interface IOutboxDelayedDispatchTrigger {
	scheduleOneShot(input: {
		outboxId: string;
		messageGroupId: string;
		delaySeconds: number;
	}): Promise<boolean>;
}

export const IOutboxDelayedDispatchTriggerSymbol = Symbol(
	'I_OUTBOX_DELAYED_DISPATCH_TRIGGER',
);
