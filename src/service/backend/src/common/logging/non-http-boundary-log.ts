import { Logger } from '@nestjs/common';

export type BoundaryLogLevel = 'log' | 'warn' | 'error';
export type BoundaryLogPayload = Record<string, unknown>;

export interface RunBoundaryOptions<T = unknown> {
	context: string;
	started?: BoundaryLogPayload;
	completed?: (result: T, durationMs: number) => BoundaryLogPayload;
	failed?: (
		error: unknown,
		durationMs: number,
	) => {
		level?: BoundaryLogLevel;
		payload: BoundaryLogPayload;
	};
}

export function writeBoundaryLog(
	context: string,
	payload: BoundaryLogPayload,
	level: BoundaryLogLevel = 'log',
): void {
	const logger = new Logger(context);
	logger[level](JSON.stringify(payload));
}

export function resolveBoundaryErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;

	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

export async function runNonHttpBoundary<T>(
	options: RunBoundaryOptions<T>,
	work: () => Promise<T>,
): Promise<T> {
	const startedAt = Date.now();

	if (options.started) {
		writeBoundaryLog(options.context, options.started);
	}

	try {
		const result = await work();
		if (options.completed) {
			writeBoundaryLog(
				options.context,
				options.completed(result, Date.now() - startedAt),
			);
		}
		return result;
	} catch (error: unknown) {
		if (options.failed) {
			const failed = options.failed(error, Date.now() - startedAt);
			writeBoundaryLog(
				options.context,
				failed.payload,
				failed.level ?? 'error',
			);
		}
		throw error;
	}
}
