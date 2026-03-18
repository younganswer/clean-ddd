import {
	CallHandler,
	ExecutionContext,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthContextAccessor } from '@/common/context/auth-context';

type HttpBoundaryLogLevel = 'log' | 'warn' | 'error';
type HttpBoundaryLogPayload = Record<string, unknown>;

function resolveRoutePath(req: Request): string | undefined {
	const route = req.route as { path?: unknown } | undefined;
	return typeof route?.path === 'string' ? route.path : undefined;
}

export class HttpRequestLoggingInterceptor implements NestInterceptor {
	constructor(private readonly authContextAccessor: AuthContextAccessor) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		if (context.getType<'http'>() !== 'http') {
			return next.handle();
		}

		const http = context.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();
		const traceId = this.ensureTraceId(req, res);
		const actor = this.authContextAccessor.getOrAnonymous().actor;
		const startedAt = Date.now();
		const method = req.method;
		const path = req.originalUrl || req.url;
		const routePath = resolveRoutePath(req);
		const controller = context.getClass().name;
		const handler = context.getHandler().name;

		this.write({
			step: 'http_request_started',
			traceId,
			method,
			path,
			routePath,
			controller,
			handler,
			actorType: actor.type,
			userId: actor.userId,
		});

		return next.handle().pipe(
			finalize(() => {
				const payload: HttpBoundaryLogPayload = {
					step: 'http_request_completed',
					traceId,
					method,
					path,
					routePath,
					controller,
					handler,
					statusCode: res.statusCode,
					durationMs: Date.now() - startedAt,
					actorType: actor.type,
					userId: actor.userId,
				};

				if (res.statusCode >= 500) {
					this.write(payload, 'error');
					return;
				}

				if (res.statusCode >= 400) {
					this.write(payload, 'warn');
					return;
				}

				this.write(payload);
			}),
		);
	}

	private write(
		payload: HttpBoundaryLogPayload,
		level: HttpBoundaryLogLevel = 'log',
	): void {
		const logger = new Logger(HttpRequestLoggingInterceptor.name);
		logger[level](JSON.stringify(payload));
	}

	private ensureTraceId(req: Request, res: Response): string {
		const incoming = (
			req.header('x-trace-id') ??
			req.header('x-request-id') ??
			''
		).trim();
		const traceId = incoming || randomUUID();

		req.headers['x-trace-id'] = traceId;
		req.headers['x-request-id'] = traceId;
		res.setHeader('x-trace-id', traceId);
		res.setHeader('x-request-id', traceId);

		return traceId;
	}
}
