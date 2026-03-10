import {
	runLoggedAsync,
	type LoggedCompletedPhase,
	type LoggedFailedPhase,
	type LoggedStartedPhase,
} from '@/common/logging/structured-log';

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

			return await runLoggedAsync(
				{
					context: constructorName,
					args,
					started: options.started,
					completed: options.completed,
					failed: options.failed,
				},
				() => original.apply(this, [...args]),
			);
		};
	};
}
