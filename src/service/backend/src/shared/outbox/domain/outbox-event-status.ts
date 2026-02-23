export enum OutboxEventStatus {
	PENDING = 'PENDING',
	PUBLISHED = 'PUBLISHED',
	CONSUMED = 'CONSUMED',
	FAILED = 'FAILED',
}
