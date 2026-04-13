import { SystemRequiredEnvMissingException } from '@/shared/exceptions';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';

export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw InfrastructureExceptionFactory.create(
			SystemRequiredEnvMissingException,
			{
				cause: { name },
				description: `missing env: ${name}`,
			},
		);
	}
	return value;
}

export function optionalEnv(name: string): string | undefined {
	const value = process.env[name];
	return value && value.length > 0 ? value : undefined;
}
