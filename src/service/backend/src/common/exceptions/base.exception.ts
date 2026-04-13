import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export type BaseExceptionResponse = string | Record<string, any>;
export type BaseExceptionOptions = {
	cause?: unknown;
	description?: string;
};

export type FactoryScopedExceptionMetadata = {
	readonly response?: BaseExceptionResponse;
	readonly status?: HttpStatus;
	readonly code?: string;
};

const DEFAULT_EXCEPTION_MESSAGE = 'Unexpected error';
const DEFAULT_EXCEPTION_CODE = 'UNEXPECTED_ERROR';

export const resolveFactoryScopedExceptionMetadata = (
	exceptionClass: FactoryScopedExceptionMetadata,
): {
	response: BaseExceptionResponse;
	status: HttpStatus;
	code: string;
} => ({
	response: exceptionClass.response ?? DEFAULT_EXCEPTION_MESSAGE,
	status: exceptionClass.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
	code: exceptionClass.code ?? DEFAULT_EXCEPTION_CODE,
});

export class BaseException extends HttpException {
	readonly code: string;
	readonly scope: ExceptionScope;

	constructor(
		response: BaseExceptionResponse,
		status: HttpStatus,
		code: string,
		scope: ExceptionScope,
		options?: BaseExceptionOptions,
	) {
		super(response, status, options);

		this.code = code;
		this.scope = scope;
	}
}
