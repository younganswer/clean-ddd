import { Logger } from '@nestjs/common';
import { LogAsyncExecution } from '@/common/logging/log-async-execution.decorator';

describe('LogAsyncExecution', () => {
	it('logs started and completed with duration for async methods', async () => {
		class SampleHandler {
			@LogAsyncExecution<[string], string>({
				started: {
					step: 'sample_started',
					getPayload: ([value]) => ({ value }),
				},
				completed: {
					step: 'sample_completed',
					durationFieldName: 'handlerTotalMs',
					getPayload: ([value], result) => ({ value, result }),
				},
			})
			async execute(value: string): Promise<string> {
				return await Promise.resolve(`${value}-done`);
			}
		}

		const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

		const handler = new SampleHandler();
		const result = await handler.execute('task-1');

		expect(result).toBe('task-1-done');
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy.mock.calls[0]?.[0]).toContain('sample_started');
		expect(logSpy.mock.calls[1]?.[0]).toContain('sample_completed');
		expect(logSpy.mock.calls[1]?.[0]).toContain('handlerTotalMs');

		logSpy.mockRestore();
	});
});
