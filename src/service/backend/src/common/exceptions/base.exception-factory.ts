import {
	BaseException,
	BaseExceptionOptions,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class BaseExceptionFactory {
	protected static readonly scope: ExceptionScope = ExceptionScope.UNEXPECTED;

	static create(
		exceptionClass: new (
			scope: ExceptionScope,
			options?: BaseExceptionOptions,
		) => BaseException,
		options?: BaseExceptionOptions,
	): BaseException {
		return new exceptionClass(this.scope, options);
	}
}

export class DomainExceptionFactory extends BaseExceptionFactory {
	protected static override readonly scope: ExceptionScope =
		ExceptionScope.DOMAIN;
}

export class ApplicationExceptionFactory extends BaseExceptionFactory {
	protected static override readonly scope: ExceptionScope =
		ExceptionScope.APPLICATION;
}

export class InfrastructureExceptionFactory extends BaseExceptionFactory {
	protected static override readonly scope: ExceptionScope =
		ExceptionScope.INFRASTRUCTURE;
}
