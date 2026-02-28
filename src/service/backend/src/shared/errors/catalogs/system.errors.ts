import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const SYSTEM_INFRA_ERRORS = {
	REQUIRED_ENV_MISSING: {
		code: 'REQUIRED_ENV_MISSING',
		message: 'Missing required env',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	NEST_APP_NOT_INITIALIZED: {
		code: 'NEST_APP_NOT_INITIALIZED',
		message: 'NestApp is not initialized',
		status: HttpStatus.INTERNAL_SERVER_ERROR,
	},
	BACKEND_ROOT_NOT_FOUND: {
		code: 'BACKEND_ROOT_NOT_FOUND',
		message: 'Failed to locate backend root',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	DATABASE_URL_REQUIRED: {
		code: 'DATABASE_URL_REQUIRED',
		message: 'DATABASE_URL_POOLED (or DATABASE_URL) is required',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const IDEMPOTENCY_DOMAIN_ERRORS = {
	IDEMPOTENCY_CONSUMER_NAME_REQUIRED: {
		code: 'IDEMPOTENCY_CONSUMER_NAME_REQUIRED',
		message: 'consumerName is required',
		status: HttpStatus.BAD_REQUEST,
	},
	IDEMPOTENCY_EVENT_ID_REQUIRED: {
		code: 'IDEMPOTENCY_EVENT_ID_REQUIRED',
		message: 'eventId is required',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;
