/// <reference types="jest" />

import {
	CallHandler,
	ConflictException,
	ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { HttpIdempotencyInterceptor } from '@/common/interceptors/http-idempotency.interceptor';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';

type IdempotencyMocks = {
	service: IdempotencyService;
	claimMock: jest.MockedFunction<IdempotencyService['claim']>;
	releaseMock: jest.MockedFunction<IdempotencyService['release']>;
};

type HttpContextMocks = {
	context: ExecutionContext;
	request: {
		method: string;
		header: (name: string) => string | undefined;
		route?: { path?: string };
		path: string;
	};
	response: {
		setHeader: jest.MockedFunction<(name: string, value: string) => void>;
	};
};

function createIdempotencyMocks(input?: {
	claimResult?: boolean;
}): IdempotencyMocks {
	const claimMock: jest.MockedFunction<IdempotencyService['claim']> = jest.fn(
		(_consumerName: string, _eventId: string) =>
			Promise.resolve(input?.claimResult ?? true),
	);
	const releaseMock: jest.MockedFunction<IdempotencyService['release']> =
		jest.fn((_consumerName: string, _eventId: string) =>
			Promise.resolve(undefined),
		);

	return {
		service: {
			claim: claimMock,
			release: releaseMock,
		} as unknown as IdempotencyService,
		claimMock,
		releaseMock,
	};
}

function createHttpContext(input?: {
	method?: string;
	headers?: Record<string, string>;
	routePath?: string;
	path?: string;
}): HttpContextMocks {
	const headers = Object.fromEntries(
		Object.entries(input?.headers ?? {}).map(([key, value]) => [
			key.toLowerCase(),
			value,
		]),
	);
	const request = {
		method: input?.method ?? 'POST',
		header: (name: string) => headers[name.toLowerCase()],
		route: input?.routePath ? { path: input.routePath } : undefined,
		path: input?.path ?? '/api/v1/orders',
	};
	const response = {
		setHeader: jest.fn(),
	};

	const context = {
		getType: jest.fn(() => 'http'),
		switchToHttp: () => ({
			getRequest: () => request,
			getResponse: () => response,
		}),
		getClass: () => ({ name: 'OrdersController' }),
		getHandler: () => ({ name: 'create' }),
	} as unknown as ExecutionContext;

	return {
		context,
		request,
		response,
	};
}

describe('HttpIdempotencyInterceptor', () => {
	it('passes through when idempotency key is missing', async () => {
		const { service, claimMock, releaseMock } = createIdempotencyMocks();
		const interceptor = new HttpIdempotencyInterceptor(
			service,
			new AuthContextAccessor(),
		);
		const { context, response } = createHttpContext();
		const nextHandle = jest.fn(() => of('ok'));
		const next: CallHandler<string> = {
			handle: nextHandle,
		};

		const result = await lastValueFrom<unknown>(
			interceptor.intercept(context, next),
		);

		expect(result).toBe('ok');
		expect(nextHandle).toHaveBeenCalledTimes(1);
		expect(claimMock).not.toHaveBeenCalled();
		expect(releaseMock).not.toHaveBeenCalled();
		expect(response.setHeader).not.toHaveBeenCalled();
	});

	it('throws conflict when duplicate idempotency claim occurs', async () => {
		const { service, claimMock, releaseMock } = createIdempotencyMocks({
			claimResult: false,
		});
		const interceptor = new HttpIdempotencyInterceptor(
			service,
			new AuthContextAccessor(),
		);
		const { context } = createHttpContext({
			headers: { 'idempotency-key': 'checkout-1' },
			routePath: '/orders',
		});
		const nextHandle = jest.fn(() => of('ok'));
		const next: CallHandler<string> = {
			handle: nextHandle,
		};

		await expect(
			lastValueFrom(interceptor.intercept(context, next)),
		).rejects.toBeInstanceOf(ConflictException);
		expect(claimMock).toHaveBeenCalledTimes(1);
		expect(releaseMock).not.toHaveBeenCalled();
		expect(nextHandle).not.toHaveBeenCalled();
	});

	it('releases claim when downstream handler throws', async () => {
		const { service, claimMock, releaseMock } = createIdempotencyMocks();
		const interceptor = new HttpIdempotencyInterceptor(
			service,
			new AuthContextAccessor(),
		);
		const { context, response } = createHttpContext({
			headers: { 'idempotency-key': 'checkout-2' },
			routePath: '/orders',
		});
		const nextHandle = jest.fn(() => throwError(() => new Error('boom')));
		const next: CallHandler = {
			handle: nextHandle,
		};

		await expect(
			lastValueFrom(interceptor.intercept(context, next)),
		).rejects.toThrow('boom');

		expect(nextHandle).toHaveBeenCalledTimes(1);
		expect(claimMock).toHaveBeenCalledTimes(1);
		expect(releaseMock).toHaveBeenCalledTimes(1);
		expect(response.setHeader).toHaveBeenCalledWith(
			'idempotency-key',
			'checkout-2',
		);
	});

	it('bypasses non-http execution contexts', async () => {
		const { service, claimMock, releaseMock } = createIdempotencyMocks();
		const interceptor = new HttpIdempotencyInterceptor(
			service,
			new AuthContextAccessor(),
		);
		const context = {
			getType: jest.fn(() => 'rpc'),
		} as unknown as ExecutionContext;
		const nextHandle = jest.fn(() => of('ok'));
		const next: CallHandler<string> = {
			handle: nextHandle,
		};

		const result = await lastValueFrom<unknown>(
			interceptor.intercept(context, next),
		);

		expect(result).toBe('ok');
		expect(nextHandle).toHaveBeenCalledTimes(1);
		expect(claimMock).not.toHaveBeenCalled();
		expect(releaseMock).not.toHaveBeenCalled();
	});
});
