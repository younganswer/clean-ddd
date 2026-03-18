import { Logger } from '@nestjs/common';
import { NonHttpRequestLoggingInterceptor } from '@/common/interceptors/non-http-request-logging.interceptor';

describe('NonHttpRequestLoggingInterceptor', () => {
	it('logs started and completed with duration for async boundaries', async () => {
		const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

		const result = await NonHttpRequestLoggingInterceptor.run(
			{
				context: 'SampleHandler',
				started: {
					step: 'sample_started',
					value: 'task-1',
				},
				completed: (_result, durationMs) => ({
					step: 'sample_completed',
					value: 'task-1',
					durationMs,
				}),
			},
			async () => await Promise.resolve('task-1-done'),
		);

		expect(result).toBe('task-1-done');
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy.mock.calls[0]?.[0]).toContain('sample_started');
		expect(logSpy.mock.calls[1]?.[0]).toContain('sample_completed');
		expect(logSpy.mock.calls[1]?.[0]).toContain('durationMs');

		logSpy.mockRestore();
	});
});
