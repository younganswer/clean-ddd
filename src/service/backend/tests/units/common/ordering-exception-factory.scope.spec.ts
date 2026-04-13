import {
	ApplicationExceptionFactory,
	DomainExceptionFactory,
} from '@/common/exceptions/base.exception-factory';
import { BaseException } from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';
import {
	OrderingException,
	OrderingUserIdRequiredException,
} from '@/shared/exceptions';

describe('Ordering exception hierarchy and factory scope', () => {
	it('creates OrderingUserIdRequiredException as OrderingException -> BaseException', () => {
		const exception = DomainExceptionFactory.create(
			OrderingUserIdRequiredException,
		);

		expect(exception).toBeInstanceOf(OrderingUserIdRequiredException);
		expect(exception).toBeInstanceOf(OrderingException);
		expect(exception).toBeInstanceOf(BaseException);
	});

	it('injects DOMAIN scope via DomainExceptionFactory and APPLICATION scope via ApplicationExceptionFactory', () => {
		const domainException = DomainExceptionFactory.create(
			OrderingUserIdRequiredException,
		);
		const applicationException = ApplicationExceptionFactory.create(
			OrderingUserIdRequiredException,
		);

		expect(domainException.scope).toBe(ExceptionScope.DOMAIN);
		expect(applicationException.scope).toBe(ExceptionScope.APPLICATION);
	});
});
