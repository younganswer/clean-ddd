import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/common/errors/error-template.type';

export const OUTBOX_INFRA_ERRORS = {
	OUTBOX_EVENT_NOT_FOUND: {
		code: 'OUTBOX_EVENT_NOT_FOUND',
		message: 'outbox event not found',
		status: HttpStatus.NOT_FOUND,
	},
	OUTBOX_CONSUMER_PROVIDER_NOT_FOUND: {
		code: 'OUTBOX_CONSUMER_PROVIDER_NOT_FOUND',
		message: 'OutboxConsumer provider not found',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	OUTBOX_HANDLER_PROVIDER_NOT_FOUND: {
		code: 'OUTBOX_HANDLER_PROVIDER_NOT_FOUND',
		message: 'Outbox handler provider not found',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	OUTBOX_HANDLER_INVALID: {
		code: 'OUTBOX_HANDLER_INVALID',
		message: 'Outbox handler contract is invalid',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE: {
		code: 'OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE',
		message: 'duplicate outbox handler registration',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
} as const satisfies Record<string, ErrorTemplate>;
