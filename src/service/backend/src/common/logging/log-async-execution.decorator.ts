import {
	runNonHttpBoundary,
	resolveBoundaryErrorMessage,
} from '@/common/logging/non-http-boundary-log';

type BoundaryLogLevel = 'log' | 'warn' | 'error';
type StructuredLogPayload = Record<string, unknown>;

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
	level?: BoundaryLogLevel;
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

type AsyncMethod<TArgs extends readonly unknown[], TResult> = (
	...args: TArgs
) => Promise<TResult>;

export interface LogAsyncExecutionOptions<
	TArgs extends readonly unknown[],
	TResult,
> {
	started?: LoggedStartedPhase<TArgs>;
	completed?: LoggedCompletedPhase<TArgs, TResult>;
	failed?: LoggedFailedPhase<TArgs>;
}

export function LogAsyncExecution<TArgs extends readonly unknown[], TResult>(
	options: LogAsyncExecutionOptions<TArgs, TResult>,
): MethodDecorator {
	return (
		target: object,
		propertyKey: string | symbol,
		descriptor: PropertyDescriptor,
	): void => {
		const original = descriptor.value as
			| AsyncMethod<TArgs, TResult>
			| undefined;
		if (!original) return;

		descriptor.value = async function (
			this: object,
			...args: TArgs
		): Promise<TResult> {
			const constructorName =
				(this as { constructor?: { name?: string } }).constructor
					?.name ??
				(target as { constructor?: { name?: string } }).constructor
					?.name ??
				String(propertyKey);

			return await runNonHttpBoundary<TResult>(
				{
					context: constructorName,
					started: options.started
						? {
								step: options.started.step,
								...(options.started.getPayload?.(args) ?? {}),
							}
						: undefined,
					completed: options.completed
						? (result: TResult, durationMs: number) => ({
								step: options.completed?.step,
								...(options.completed?.getPayload?.(
									args,
									result,
									durationMs,
								) ?? {}),
								durationMs,
							})
						: undefined,
					failed: options.failed
						? (error: unknown, durationMs: number) => ({
								level: options.failed?.level,
								payload: {
									step: options.failed?.step,
									error: resolveBoundaryErrorMessage(error),
									durationMs,
									...(options.failed?.getPayload?.(
										args,
										error,
										durationMs,
									) ?? {}),
								},
							})
						: undefined,
				},
				() => original.apply(this, [...args]),
			);
		};
	};
}
