import { HttpStatus } from '@nestjs/common';
import { ErrorScope } from '@/common/errors/error-scope.enum';

export type BaseErrorOptions = {
	code: string;
	status: HttpStatus;
	scope?: ErrorScope;
	details?: unknown;
	cause?: unknown;
};

export class BaseError extends Error {
	readonly code: string;
	readonly status: HttpStatus;
	readonly scope: ErrorScope;
	readonly details?: unknown;

	constructor(message: string, options: BaseErrorOptions) {
		super(message);
		this.name = new.target.name;
		this.code = options.code;
		this.status = options.status;
		this.scope = options.scope ?? ErrorScope.UNEXPECTED;
		this.details = options.details;

		if (options.cause !== undefined) {
			(this as Error & { cause?: unknown }).cause = options.cause;
		}
	}
}

type ErrorOptions = {
	code: string;
	status: HttpStatus;
	details?: unknown;
	cause?: unknown;
};

export class DomainError extends BaseError {
	constructor(message: string, options: ErrorOptions) {
		super(message, {
			...options,
			scope: ErrorScope.DOMAIN,
		});
	}
}

export class ApplicationError extends BaseError {
	constructor(message: string, options: ErrorOptions) {
		super(message, {
			...options,
			scope: ErrorScope.APPLICATION,
		});
	}
}

export class InfrastructureError extends BaseError {
	constructor(message: string, options: ErrorOptions) {
		super(message, {
			...options,
			scope: ErrorScope.INFRASTRUCTURE,
		});
	}
}
