import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const OUTBOX_INFRA_ERRORS = {
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
} as const satisfies Record<string, ErrorTemplate>;
