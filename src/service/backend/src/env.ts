import { SYSTEM_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw InfrastructureErrorFactory.create(
			SYSTEM_INFRA_ERRORS.REQUIRED_ENV_MISSING,
			{
				message: `Missing required env: ${name}`,
				details: { name },
			},
		);
	}
	return value;
}

export function optionalEnv(name: string): string | undefined {
	const value = process.env[name];
	return value && value.length > 0 ? value : undefined;
}
