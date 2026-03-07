export const IOutboxProducerSymbol = Symbol('IOutboxProducer');

export interface IOutboxProducer {
	publish(
		event: object,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<string>;
	emit(
		eventType: string,
		payload: Record<string, unknown>,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<string>;
}
