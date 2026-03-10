import { Logger } from '@nestjs/common';

export type StructuredLogLevel = 'log' | 'warn' | 'error';

export type StructuredLogPayload = Record<string, unknown>;

export type LogContent = string | StructuredLogPayload;

type StartedPayloadFactory<TArgs extends readonly unknown[]> = (
	args: TArgs,
) => StructuredLogPayload | void;

type CompletedPayloadFactory<TArgs extends readonly unknown[], TResult> = (
	args: TArgs,
	result: TResult,
	durationMs: number,
) => StructuredLogPayload | void;

type FailedPayloadFactory<TArgs extends readonly unknown[]> = (
	args: TArgs,
	error: unknown,
	durationMs: number,
) => StructuredLogPayload | void;

interface LoggedPhaseBase {
	step: string;
	level?: StructuredLogLevel;
	durationFieldName?: string;
}

export interface LoggedStartedPhase<
	TArgs extends readonly unknown[],
> extends LoggedPhaseBase {
	getPayload?: StartedPayloadFactory<TArgs>;
}

export interface LoggedCompletedPhase<
	TArgs extends readonly unknown[],
	TResult,
> extends LoggedPhaseBase {
	getPayload?: CompletedPayloadFactory<TArgs, TResult>;
}

export interface LoggedFailedPhase<
	TArgs extends readonly unknown[],
> extends LoggedPhaseBase {
	getPayload?: FailedPayloadFactory<TArgs>;
}

export interface RunLoggedAsyncOptions<
	TArgs extends readonly unknown[],
	TResult,
> {
	context: string;
	args: TArgs;
	started?: LoggedStartedPhase<TArgs>;
	completed?: LoggedCompletedPhase<TArgs, TResult>;
	failed?: LoggedFailedPhase<TArgs>;
}

export interface MeasuredAsyncStepResult<TResult> {
	result: TResult;
	durationMs: number;
}

function withDuration(
	payload: StructuredLogPayload,
	fieldName: string | undefined,
	durationMs: number,
): StructuredLogPayload {
	if (!fieldName) return payload;

	return {
		...payload,
		[fieldName]: durationMs,
	};
}

export function resolveStructuredLogErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;

	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

export function writeStructuredLog(
	context: string,
	payload: StructuredLogPayload,
	level: StructuredLogLevel = 'log',
): void {
	writeLogContent(context, payload, level);
}

export function writeLogMessage(
	context: string,
	message: string,
	level: StructuredLogLevel = 'log',
): void {
	writeLogContent(context, message, level);
}

function writeLogContent(
	context: string,
	content: LogContent,
	level: StructuredLogLevel,
): void {
	const logger = new Logger(context);
	logger[level](
		typeof content === 'string' ? content : JSON.stringify(content),
	);
}

export async function measureAsyncStep<TResult>(
	work: () => Promise<TResult>,
): Promise<MeasuredAsyncStepResult<TResult>> {
	const startedAt = Date.now();
	const result = await work();

	return {
		result,
		durationMs: Date.now() - startedAt,
	};
}

export async function runLoggedAsync<TArgs extends readonly unknown[], TResult>(
	options: RunLoggedAsyncOptions<TArgs, TResult>,
	work: () => Promise<TResult>,
): Promise<TResult> {
	const startedAt = Date.now();

	if (options.started) {
		const payload = {
			step: options.started.step,
			...(options.started.getPayload?.(options.args) ?? {}),
		};
		writeStructuredLog(
			options.context,
			payload,
			options.started.level ?? 'log',
		);
	}

	try {
		const result = await work();
		if (options.completed) {
			const durationMs = Date.now() - startedAt;
			const payload = withDuration(
				{
					step: options.completed.step,
					...(options.completed.getPayload?.(
						options.args,
						result,
						durationMs,
					) ?? {}),
				},
				options.completed.durationFieldName ?? 'durationMs',
				durationMs,
			);
			writeStructuredLog(
				options.context,
				payload,
				options.completed.level ?? 'log',
			);
		}
		return result;
	} catch (error: unknown) {
		if (options.failed) {
			const durationMs = Date.now() - startedAt;
			const payload = withDuration(
				{
					step: options.failed.step,
					error: resolveStructuredLogErrorMessage(error),
					...(options.failed.getPayload?.(
						options.args,
						error,
						durationMs,
					) ?? {}),
				},
				options.failed.durationFieldName ?? 'durationMs',
				durationMs,
			);
			writeStructuredLog(
				options.context,
				payload,
				options.failed.level ?? 'error',
			);
		}
		throw error;
	}
}
