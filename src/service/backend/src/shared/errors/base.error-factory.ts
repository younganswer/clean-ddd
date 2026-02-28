import {
	ApplicationError,
	BaseError,
	DomainError,
	InfrastructureError,
} from '@/shared/errors/base.error';
import { ErrorScope } from '@/shared/errors/error-scope.enum';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export type ErrorFactoryOptions = {
	details?: unknown;
	cause?: unknown;
	message?: string;
};

const ERROR_MAP = {
	[ErrorScope.DOMAIN]: DomainError,
	[ErrorScope.APPLICATION]: ApplicationError,
	[ErrorScope.INFRASTRUCTURE]: InfrastructureError,
	[ErrorScope.UNEXPECTED]: BaseError,
};

export class BaseErrorFactory {
	protected static scope: ErrorScope = ErrorScope.UNEXPECTED;

	static create(
		this: typeof BaseErrorFactory,
		template: ErrorTemplate,
		options?: ErrorFactoryOptions,
	): BaseError {
		const message = options?.message ?? template.message;
		const status = template.status;

		return new ERROR_MAP[this.scope](message, {
			code: template.code,
			status,
			details: options?.details,
			cause: options?.cause,
		});
	}
}

export class DomainErrorFactory extends BaseErrorFactory {
	protected static override scope: ErrorScope = ErrorScope.DOMAIN;
}

export class ApplicationErrorFactory extends BaseErrorFactory {
	protected static override scope: ErrorScope = ErrorScope.APPLICATION;
}

export class InfrastructureErrorFactory extends BaseErrorFactory {
	protected static override scope: ErrorScope = ErrorScope.INFRASTRUCTURE;
}
