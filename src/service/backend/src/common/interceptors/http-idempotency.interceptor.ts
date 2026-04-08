import {
	CallHandler,
	ConflictException,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const MUTATING_HTTP_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type IdempotencyClaimContext = {
	consumerName: string;
	eventId: string;
	rawKey: string;
};

function resolveRoutePath(req: Request): string {
	const route = req.route as { path?: unknown } | undefined;
	if (typeof route?.path === 'string' && route.path.trim()) {
		return route.path.trim();
	}

	return req.path;
}

@Injectable()
export class HttpIdempotencyInterceptor implements NestInterceptor {
	constructor(
		private readonly idempotencyService: IdempotencyService,
		private readonly authContextAccessor: AuthContextAccessor,
	) {}

	private resolveClaimContext(
		context: ExecutionContext,
		req: Request,
	): IdempotencyClaimContext | null {
		const method = String(req.method ?? '').toUpperCase();
		if (!MUTATING_HTTP_METHODS.has(method)) {
			return null;
		}

		const rawKey = String(req.header(IDEMPOTENCY_KEY_HEADER) ?? '').trim();
		if (!rawKey) {
			return null;
		}

		const actor = this.authContextAccessor.getOrAnonymous().actor;
		const controller = context.getClass().name;
		const handler = context.getHandler().name;
		const routePath = resolveRoutePath(req);
		const consumerName = [
			'HttpIdempotency',
			method,
			routePath,
			controller,
			handler,
			actor.type,
			actor.userId,
		].join(':');

		return {
			consumerName,
			eventId: this.resolveEventId(consumerName, rawKey),
			rawKey,
		};
	}

	private resolveEventId(consumerName: string, rawKey: string): string {
		const seed = `${consumerName}:${rawKey}`;
		const hash = createHash('sha256').update(seed).digest();
		const bytes = Buffer.from(hash.subarray(0, 16));

		bytes[6] = (bytes[6] & 0x0f) | 0x50;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;

		const hex = bytes.toString('hex');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		if (context.getType<'http'>() !== 'http') {
			return next.handle();
		}

		const http = context.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();
		const claimContext = this.resolveClaimContext(context, req);
		if (!claimContext) {
			return next.handle();
		}

		return from(
			this.idempotencyService.claim(
				claimContext.consumerName,
				claimContext.eventId,
			),
		).pipe(
			mergeMap((claimed) => {
				if (!claimed) {
					throw new ConflictException(
						'duplicate idempotency request',
					);
				}

				res.setHeader(IDEMPOTENCY_KEY_HEADER, claimContext.rawKey);

				return next.handle().pipe(
					catchError((error: unknown) =>
						from(
							this.idempotencyService.release(
								claimContext.consumerName,
								claimContext.eventId,
							),
						).pipe(
							catchError(() => of(undefined)),
							mergeMap(() => throwError(() => error)),
						),
					),
				);
			}),
		);
	}
}
