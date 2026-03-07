import { ErrorTemplate } from '@/common/errors/error-template.type';

export const SYSTEM_INFRA_ERRORS = {
	REQUIRED_ENV_MISSING: {
		code: 'REQUIRED_ENV_MISSING',
		message: 'Missing required env',
		status: 503,
	},
	NEST_APP_NOT_INITIALIZED: {
		code: 'NEST_APP_NOT_INITIALIZED',
		message: 'NestApp is not initialized',
		status: 500,
	},
	BACKEND_ROOT_NOT_FOUND: {
		code: 'BACKEND_ROOT_NOT_FOUND',
		message: 'Failed to locate backend root',
		status: 503,
	},
	DATABASE_URL_REQUIRED: {
		code: 'DATABASE_URL_REQUIRED',
		message: 'DATABASE_URL_POOLED (or DATABASE_URL) is required',
		status: 503,
	},
	REQUEST_CONTEXT_TRANSACTION_REQUIRED: {
		code: 'REQUEST_CONTEXT_TRANSACTION_REQUIRED',
		message: 'An active RequestContext transaction is required',
		status: 500,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const IDEMPOTENCY_DOMAIN_ERRORS = {
	IDEMPOTENCY_CONSUMER_NAME_REQUIRED: {
		code: 'IDEMPOTENCY_CONSUMER_NAME_REQUIRED',
		message: 'consumerName is required',
		status: 400,
	},
	IDEMPOTENCY_EVENT_ID_REQUIRED: {
		code: 'IDEMPOTENCY_EVENT_ID_REQUIRED',
		message: 'eventId is required',
		status: 400,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const SYSTEM_APPLICATION_ERRORS = {
	GRAPH_ROOT_NOT_FOUND: {
		code: 'GRAPH_ROOT_NOT_FOUND',
		message: 'graph root not found',
		status: 404,
	},
} as const satisfies Record<string, ErrorTemplate>;
