import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
	runNonHttpBoundary,
	resolveBoundaryErrorMessage,
	writeBoundaryLog,
	type BoundaryLogLevel,
	type BoundaryLogPayload,
	type RunBoundaryOptions,
} from '@/common/logging/non-http-boundary-log';

@Injectable()
export class NonHttpRequestLoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		if (context.getType<'http'>() === 'http') {
			return next.handle();
		}

		const startedAt = Date.now();
		const className = context.getClass()?.name ?? 'UnknownClass';
		const handlerName = context.getHandler()?.name ?? 'unknownHandler';
		const contextType = context.getType<string>();
		let caughtError: unknown;

		writeBoundaryLog(NonHttpRequestLoggingInterceptor.name, {
			step: 'non_http_request_started',
			className,
			handlerName,
			contextType,
		});

		return next.handle().pipe(
			tap({
				error: (error: unknown) => {
					caughtError = error;
				},
			}),
			finalize(() => {
				const durationMs = Date.now() - startedAt;
				if (caughtError) {
					writeBoundaryLog(
						NonHttpRequestLoggingInterceptor.name,
						{
							step: 'non_http_request_failed',
							className,
							handlerName,
							contextType,
							durationMs,
							error: resolveBoundaryErrorMessage(caughtError),
						},
						'error',
					);
					return;
				}

				writeBoundaryLog(NonHttpRequestLoggingInterceptor.name, {
					step: 'non_http_request_completed',
					className,
					handlerName,
					contextType,
					durationMs,
				});
			}),
		);
	}

	static async run<T>(
		options: RunBoundaryOptions<T>,
		work: () => Promise<T>,
	): Promise<T> {
		return await runNonHttpBoundary(options, work);
	}

	static write(
		context: string,
		payload: BoundaryLogPayload,
		level: BoundaryLogLevel = 'log',
	): void {
		writeBoundaryLog(context, payload, level);
	}

	static resolveErrorMessage(error: unknown): string {
		return resolveBoundaryErrorMessage(error);
	}
}
