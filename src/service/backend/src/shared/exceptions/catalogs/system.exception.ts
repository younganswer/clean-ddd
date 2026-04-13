import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class SystemException extends BaseException {
	static readonly factoryScoped = true as const;
	static readonly status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code: string = 'UNEXPECTED_ERROR';

	constructor(scope: ExceptionScope, options?: BaseExceptionOptions) {
		const { response, status, code } =
			resolveFactoryScopedExceptionMetadata(
				new.target as FactoryScopedExceptionMetadata,
			);
		super(response, status, code, scope, options);
	}
}

export class SystemRequiredEnvMissingException extends SystemException {
	static readonly response = 'Missing required env';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'REQUIRED_ENV_MISSING';
}

export class SystemNestAppNotInitializedException extends SystemException {
	static readonly response = 'NestApp is not initialized';
	static readonly status = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code = 'NEST_APP_NOT_INITIALIZED';
}

export class SystemBackendRootNotFoundException extends SystemException {
	static readonly response = 'Failed to locate backend root';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'BACKEND_ROOT_NOT_FOUND';
}

export class SystemDatabaseUrlRequiredException extends SystemException {
	static readonly response =
		'DATABASE_URL_POOLED (or DATABASE_URL) is required';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'DATABASE_URL_REQUIRED';
}

export class SystemRequestContextTransactionRequiredException extends SystemException {
	static readonly response =
		'An active RequestContext transaction is required';
	static readonly status = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code = 'REQUEST_CONTEXT_TRANSACTION_REQUIRED';
}

export class IdempotencyConsumerNameRequiredException extends SystemException {
	static readonly response = 'consumerName is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'IDEMPOTENCY_CONSUMER_NAME_REQUIRED';
}

export class IdempotencyEventIdRequiredException extends SystemException {
	static readonly response = 'eventId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'IDEMPOTENCY_EVENT_ID_REQUIRED';
}

export class SystemGraphRootNotFoundException extends SystemException {
	static readonly response = 'graph root not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'GRAPH_ROOT_NOT_FOUND';
}
