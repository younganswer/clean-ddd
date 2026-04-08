function envValue(name: string): string | undefined {
	const value = process.env[name];
	if (value === undefined) return undefined;

	const trimmed = value.trim().toLowerCase();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function isPortListenEnabled(): boolean {
	const value = envValue('PORT_LISTEN');
	if (value === undefined) return true;
	return value === 'true';
}

export function isOutboxCronEnabled(): boolean {
	const value = envValue('OUTBOX_CRON_ENABLED');
	if (value === undefined) return true;
	return value !== 'false';
}

export function isOutboxPollingEnabled(): boolean {
	const value = envValue('OUTBOX_POLLING_ENABLED');
	return value === 'true';
}

export function isOutboxHandlerImmediateDispatchEnabled(): boolean {
	const value = envValue('OUTBOX_HANDLER_IMMEDIATE_DISPATCH');
	if (value === undefined) return true;
	return value !== 'false';
}
