import {
	runNonHttpBoundary,
	resolveBoundaryErrorMessage,
	type BoundaryLogLevel,
	type BoundaryLogPayload,
} from '@/common/logging/non-http-boundary-log';

type AsyncMethod<TArgs extends readonly unknown[], TResult> = (
	...args: TArgs
) => Promise<TResult>;

type StartedPayloadFactory<TArgs extends readonly unknown[]> = (
	args: TArgs,
) => BoundaryLogPayload | void;

type CompletedPayloadFactory<TArgs extends readonly unknown[], TResult> = (
	args: TArgs,
	result: TResult,
	durationMs: number,
) => BoundaryLogPayload | void;

type FailedPayloadFactory<TArgs extends readonly unknown[]> = (
	args: TArgs,
	error: unknown,
	durationMs: number,
) => BoundaryLogPayload | void;

interface LogBoundaryPhaseBase {
	step: string;
	level?: BoundaryLogLevel;
}

interface LogBoundaryStartedPhase<
	TArgs extends readonly unknown[],
> extends LogBoundaryPhaseBase {
	getPayload?: StartedPayloadFactory<TArgs>;
}

interface LogBoundaryCompletedPhase<
	TArgs extends readonly unknown[],
	TResult,
> extends LogBoundaryPhaseBase {
	getPayload?: CompletedPayloadFactory<TArgs, TResult>;
}

interface LogBoundaryFailedPhase<
	TArgs extends readonly unknown[],
> extends LogBoundaryPhaseBase {
	getPayload?: FailedPayloadFactory<TArgs>;
}

export interface LogBoundaryOptions<TArgs extends readonly unknown[], TResult> {
	started?: LogBoundaryStartedPhase<TArgs>;
	completed?: LogBoundaryCompletedPhase<TArgs, TResult>;
	failed?: LogBoundaryFailedPhase<TArgs>;
	rethrow?: boolean;
}

export function LogBoundary<TArgs extends readonly unknown[], TResult>(
	options: LogBoundaryOptions<TArgs, TResult>,
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
		): Promise<TResult | void> {
			const constructorName =
				(this as { constructor?: { name?: string } }).constructor
					?.name ??
				(target as { constructor?: { name?: string } }).constructor
					?.name ??
				String(propertyKey);

			try {
				return await runNonHttpBoundary(
					{
						context: constructorName,
						started: options.started
							? {
									step: options.started.step,
									...(options.started.getPayload?.(args) ??
										{}),
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
										error: resolveBoundaryErrorMessage(
											error,
										),
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
			} catch (error: unknown) {
				if (options.rethrow ?? true) {
					throw error;
				}
				return;
			}
		};
	};
}
