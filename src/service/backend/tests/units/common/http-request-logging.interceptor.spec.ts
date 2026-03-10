import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { HttpRequestLoggingInterceptor } from '@/common/interceptors/http-request-logging.interceptor';

type HttpRequestMock = {
	method: string;
	originalUrl: string;
	url: string;
	route: { path: string };
	headers: Record<string, string>;
	header(name: string): string | undefined;
};

type HttpResponseMock = {
	statusCode: number;
	setHeader: jest.Mock;
};

describe('HttpRequestLoggingInterceptor', () => {
	it('logs request start and completion and assigns trace headers', async () => {
		const authContextAccessor = new AuthContextAccessor();
		authContextAccessor.setActor({ userId: 'user-1', type: 'user' });

		const interceptor = new HttpRequestLoggingInterceptor(
			authContextAccessor,
		);
		const setHeader = jest.fn();
		const headers: Record<string, string> = {};
		const req: HttpRequestMock = {
			method: 'POST',
			originalUrl: '/api/v1/orders/order-1/payments/intents',
			url: '/api/v1/orders/order-1/payments/intents',
			route: { path: '/orders/:orderId/payments/intents' },
			headers,
			header: (name: string): string | undefined => {
				const lowered = name.toLowerCase();
				return headers[lowered];
			},
		};
		const res: HttpResponseMock = {
			statusCode: 201,
			setHeader,
		};

		const executionContext = {
			getType: () => 'http',
			switchToHttp: () => ({
				getRequest: () => req,
				getResponse: () => res,
			}),
			getClass: () => ({ name: 'PaymentsController' }),
			getHandler: () => ({ name: 'createIntent' }),
		} as ExecutionContext;

		const callHandler = {
			handle: () => of({ ok: true }),
		} as CallHandler;

		const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

		await new Promise<void>((resolve, reject) => {
			interceptor.intercept(executionContext, callHandler).subscribe({
				complete: () => resolve(),
				error: reject,
			});
		});

		expect(setHeader).toHaveBeenCalledWith(
			'x-trace-id',
			expect.any(String),
		);
		expect(setHeader).toHaveBeenCalledWith(
			'x-request-id',
			expect.any(String),
		);
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy.mock.calls[0]?.[0]).toContain('http_request_started');
		expect(logSpy.mock.calls[1]?.[0]).toContain('http_request_completed');

		logSpy.mockRestore();
	});
});
