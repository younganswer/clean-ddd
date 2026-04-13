import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';
import { ErrorResponse, ResponseHelper } from '@/common/responses';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const http = host.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();

		const traceId =
			(
				req.header('x-trace-id') ??
				req.header('x-request-id') ??
				''
			).trim() || 'unknown';

		const mapped = this.mapException(exception);
		const body: ErrorResponse = {
			type: `about:blank#${mapped.code}`,
			title: this.getTitle(mapped.status),
			status: mapped.status,
			detail: mapped.detail,
			instance: req.originalUrl || req.url,
			code: mapped.code,
			traceId,
			timestamp: new Date().toISOString(),
		};

		if (mapped.errors !== undefined) {
			body.errors = mapped.errors;
		}

		res.status(mapped.status).json(ResponseHelper.error(body));
	}

	private mapException(exception: unknown): {
		status: number;
		detail: string;
		code: string;
		errors?: unknown;
	} {
		if (exception instanceof BaseException) {
			const response = exception.getResponse();
			return {
				status: this.statusFromBaseException(exception),
				detail: this.detailFromResponse(response, exception.message),
				code: exception.code,
				errors: this.errorsFromBaseException(exception, response),
			};
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const response = exception.getResponse();

			if (typeof response === 'string') {
				return {
					status,
					detail: response,
					code: this.codeFromStatus(status),
				};
			}

			if (response && typeof response === 'object') {
				const payload = response as {
					message?: string | string[];
					error?: string;
					code?: string;
				};
				const detail = Array.isArray(payload.message)
					? payload.message.join(', ')
					: (payload.message ?? payload.error ?? exception.message);
				return {
					status,
					detail,
					code: payload.code ?? this.codeFromStatus(status),
					errors: Array.isArray(payload.message)
						? payload.message
						: undefined,
				};
			}

			return {
				status,
				detail: exception.message,
				code: this.codeFromStatus(status),
			};
		}

		if (exception instanceof Error) {
			return {
				status: HttpStatus.INTERNAL_SERVER_ERROR,
				detail: exception.message,
				code: 'UNEXPECTED_ERROR',
			};
		}

		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			detail: 'Unexpected error',
			code: 'UNEXPECTED_ERROR',
		};
	}

	private detailFromResponse(response: unknown, fallback: string): string {
		if (typeof response === 'string') {
			return response;
		}

		if (response && typeof response === 'object') {
			const payload = response as {
				message?: string | string[];
				detail?: string;
				error?: string;
			};

			if (Array.isArray(payload.message)) {
				return payload.message.join(', ');
			}
			if (typeof payload.message === 'string' && payload.message.trim()) {
				return payload.message;
			}
			if (typeof payload.detail === 'string' && payload.detail.trim()) {
				return payload.detail;
			}
			if (typeof payload.error === 'string' && payload.error.trim()) {
				return payload.error;
			}
		}

		return fallback;
	}

	private errorsFromBaseException(
		exception: BaseException,
		response: unknown,
	): unknown {
		if (response && typeof response === 'object') {
			const payload = response as {
				errors?: unknown;
				cause?: unknown;
			};
			if (payload.errors !== undefined) {
				return payload.errors;
			}
			if (payload.cause !== undefined) {
				return payload.cause;
			}
		}

		const errorCause = (exception as Error & { cause?: unknown }).cause;
		if (errorCause !== undefined) {
			return errorCause;
		}

		return undefined;
	}

	private statusFromBaseException(error: BaseException): number {
		const supplemental = this.statusFromErrorCode(error.code, error.scope);
		if (supplemental !== undefined) {
			return supplemental;
		}

		const status = error.getStatus();
		if (typeof status === 'number') {
			return status;
		}

		switch (error.scope) {
			case ExceptionScope.DOMAIN:
				return HttpStatus.BAD_REQUEST;
			case ExceptionScope.APPLICATION:
				return HttpStatus.CONFLICT;
			case ExceptionScope.INFRASTRUCTURE:
				return HttpStatus.SERVICE_UNAVAILABLE;
			case ExceptionScope.UNEXPECTED:
			default:
				return HttpStatus.INTERNAL_SERVER_ERROR;
		}
	}

	private statusFromErrorCode(
		code: string,
		scope: ExceptionScope,
	): number | undefined {
		const normalized = String(code ?? '')
			.trim()
			.toUpperCase();
		if (!normalized) return undefined;

		const explicitMap: Record<string, number> = {
			USER_NOT_FOUND: HttpStatus.NOT_FOUND,
			ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
			PAYMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
			INVENTORY_ITEM_NOT_FOUND: HttpStatus.NOT_FOUND,
		};

		if (normalized in explicitMap) {
			return explicitMap[normalized];
		}

		if (normalized.endsWith('_NOT_FOUND')) {
			return HttpStatus.NOT_FOUND;
		}
		if (normalized.includes('UNAUTHORIZED')) {
			return HttpStatus.UNAUTHORIZED;
		}
		if (normalized.includes('FORBIDDEN')) {
			return HttpStatus.FORBIDDEN;
		}

		if (
			scope === ExceptionScope.DOMAIN ||
			scope === ExceptionScope.APPLICATION
		) {
			if (normalized.endsWith('_REQUIRED')) {
				return HttpStatus.BAD_REQUEST;
			}
			if (normalized.includes('_INVALID')) {
				return HttpStatus.BAD_REQUEST;
			}
		}

		return undefined;
	}

	private codeFromStatus(status: number): string {
		const codeByStatus: Record<number, string> = {
			400: 'BAD_REQUEST',
			401: 'UNAUTHORIZED',
			403: 'FORBIDDEN',
			404: 'NOT_FOUND',
			409: 'CONFLICT',
			422: 'UNPROCESSABLE_ENTITY',
			503: 'SERVICE_UNAVAILABLE',
		};

		return codeByStatus[status] ?? 'HTTP_EXCEPTION';
	}

	private getTitle(status: number): string {
		const title = HttpStatus[status];
		return typeof title === 'string' ? title : 'HTTP_EXCEPTION';
	}
}
