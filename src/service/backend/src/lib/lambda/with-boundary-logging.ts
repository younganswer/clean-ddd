import {
	runNonHttpBoundary,
	resolveBoundaryErrorMessage,
	type BoundaryLogLevel,
	type BoundaryLogPayload,
} from '@/common/logging/non-http-boundary-log';

interface LambdaBoundaryOptions<TResult> {
	context: string;
	started?: BoundaryLogPayload;
	completed?: (result: TResult, durationMs: number) => BoundaryLogPayload;
	failed?: (
		error: unknown,
		durationMs: number,
	) => {
		level?: BoundaryLogLevel;
		payload: BoundaryLogPayload;
	};
}

export async function withBoundaryLogging<TResult>(
	options: LambdaBoundaryOptions<TResult>,
	handler: () => Promise<TResult>,
): Promise<TResult> {
	return await runNonHttpBoundary(options, handler);
}

export { resolveBoundaryErrorMessage };
