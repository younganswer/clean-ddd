import { Logger } from '@nestjs/common';
import { resolveOutboxTimeoutPolicy } from '@/modules/outbox/application/outbox-timeout-policy';

describe('resolveOutboxTimeoutPolicy', () => {
	const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

	beforeEach(() => {
		warnSpy.mockReset();
	});

	afterAll(() => {
		warnSpy.mockRestore();
	});

	it('uses defaults when both env values are absent', () => {
		const result = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: undefined,
			visibilityTimeoutSecondsRaw: undefined,
			defaultLockTimeoutMs: 120_000,
			defaultVisibilityTimeoutSeconds: 30,
			loggerContext: 'OutboxTimeoutPolicySpec',
		});

		expect(result).toEqual({
			lockTimeoutMs: 120_000,
			visibilityTimeoutSeconds: 30,
		});
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('derives lock timeout from visibility timeout when visibility is set', () => {
		const result = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: undefined,
			visibilityTimeoutSecondsRaw: '45',
			defaultLockTimeoutMs: 120_000,
			defaultVisibilityTimeoutSeconds: 30,
			loggerContext: 'OutboxTimeoutPolicySpec',
		});

		expect(result).toEqual({
			lockTimeoutMs: 45_000,
			visibilityTimeoutSeconds: 45,
		});
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('derives visibility timeout from lock timeout when lock is set', () => {
		const result = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: '125000',
			visibilityTimeoutSecondsRaw: undefined,
			defaultLockTimeoutMs: 120_000,
			defaultVisibilityTimeoutSeconds: 30,
			loggerContext: 'OutboxTimeoutPolicySpec',
		});

		expect(result).toEqual({
			lockTimeoutMs: 125_000,
			visibilityTimeoutSeconds: 125,
		});
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('aligns lock timeout to visibility timeout when both are set but mismatched', () => {
		const result = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: '120000',
			visibilityTimeoutSecondsRaw: '30',
			defaultLockTimeoutMs: 120_000,
			defaultVisibilityTimeoutSeconds: 30,
			loggerContext: 'OutboxTimeoutPolicySpec',
		});

		expect(result).toEqual({
			lockTimeoutMs: 30_000,
			visibilityTimeoutSeconds: 30,
		});
		expect(warnSpy).toHaveBeenCalledTimes(1);
	});

	it('ignores invalid env values and falls back to defaults', () => {
		const result = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: 'abc',
			visibilityTimeoutSecondsRaw: '-1',
			defaultLockTimeoutMs: 120_000,
			defaultVisibilityTimeoutSeconds: 30,
			loggerContext: 'OutboxTimeoutPolicySpec',
		});

		expect(result).toEqual({
			lockTimeoutMs: 120_000,
			visibilityTimeoutSeconds: 30,
		});
		expect(warnSpy).toHaveBeenCalledTimes(2);
	});
});
