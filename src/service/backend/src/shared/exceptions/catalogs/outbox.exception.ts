import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class OutboxException extends BaseException {
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

export class OutboxEventNotFoundException extends OutboxException {
	static readonly response = 'outbox event not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'OUTBOX_EVENT_NOT_FOUND';
}

export class OutboxConsumerProviderNotFoundException extends OutboxException {
	static readonly response = 'OutboxConsumer provider not found';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'OUTBOX_CONSUMER_PROVIDER_NOT_FOUND';
}

export class OutboxHandlerProviderNotFoundException extends OutboxException {
	static readonly response = 'Outbox handler provider not found';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'OUTBOX_HANDLER_PROVIDER_NOT_FOUND';
}

export class OutboxHandlerInvalidException extends OutboxException {
	static readonly response = 'Outbox handler contract is invalid';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'OUTBOX_HANDLER_INVALID';
}

export class OutboxHandlerDuplicateEventTypeException extends OutboxException {
	static readonly response = 'duplicate outbox handler registration';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'OUTBOX_HANDLER_DUPLICATE_EVENT_TYPE';
}
