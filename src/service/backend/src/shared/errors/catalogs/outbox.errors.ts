import { ErrorTemplate } from '@/common/errors/error-template.type';

export const OUTBOX_INFRA_ERRORS = {
	OUTBOX_EVENT_NOT_FOUND: {
		code: 'OUTBOX_EVENT_NOT_FOUND',
		message: 'outbox event not found',
		status: 404,
	},
	OUTBOX_CONSUMER_PROVIDER_NOT_FOUND: {
		code: 'OUTBOX_CONSUMER_PROVIDER_NOT_FOUND',
		message: 'OutboxConsumer provider not found',
		status: 503,
	},
	OUTBOX_HANDLER_PROVIDER_NOT_FOUND: {
		code: 'OUTBOX_HANDLER_PROVIDER_NOT_FOUND',
		message: 'Outbox handler provider not found',
		status: 503,
	},
	OUTBOX_HANDLER_INVALID: {
		code: 'OUTBOX_HANDLER_INVALID',
		message: 'Outbox handler contract is invalid',
		status: 503,
	},
	OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE: {
		code: 'OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE',
		message: 'duplicate outbox handler registration',
		status: 503,
	},
} as const satisfies Record<string, ErrorTemplate>;
