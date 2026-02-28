import type { Options } from '@mikro-orm/core';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import fs from 'node:fs';
import path from 'node:path';
import { SYSTEM_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/shared/errors/base.error-factory';

function findBackendRoot(): string {
	const candidates = [process.cwd(), __dirname];

	for (const start of candidates) {
		let dir = path.resolve(start);

		while (true) {
			const hasNestCli = fs.existsSync(path.join(dir, 'nest-cli.json'));
			const hasSrc = fs.existsSync(path.join(dir, 'src'));
			const hasPackageJson = fs.existsSync(
				path.join(dir, 'package.json'),
			);
			const hasDistSrc = fs.existsSync(path.join(dir, 'dist', 'src'));

			if ((hasNestCli && hasSrc) || (hasPackageJson && hasDistSrc)) {
				return dir;
			}

			const parent = path.dirname(dir);
			if (parent === dir) {
				break;
			}
			dir = parent;
		}
	}

	throw InfrastructureErrorFactory.create(
		SYSTEM_INFRA_ERRORS.BACKEND_ROOT_NOT_FOUND,
		{
			message: `Failed to locate backend root (need either nest-cli.json + src or package.json + dist/src). cwd=${process.cwd()} dirname=${__dirname}`,
			details: {
				cwd: process.cwd(),
				dirname: __dirname,
			},
		},
	);
}

function shouldPreferTs(): boolean {
	// `nest start --watch` compiles to `dist/` and runs Node on JS output;
	// in that mode, loading TS entity files will crash with a SyntaxError.
	return !__dirname.split(path.sep).includes('dist');
}

function databaseUrlForRuntime(): string {
	const rawUrl =
		process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? '';

	if (!rawUrl) return '';

	try {
		const parsed = new URL(rawUrl);
		const protocol = parsed.protocol.toLowerCase();

		if (protocol === 'postgres:' || protocol === 'postgresql:') {
			const sslmode = parsed.searchParams.get('sslmode')?.toLowerCase();
			const secureModes = new Set([
				'require',
				'verify-ca',
				'verify-full',
			]);

			if (!sslmode || !secureModes.has(sslmode)) {
				parsed.searchParams.set('sslmode', 'require');
			}

			return parsed.toString();
		}

		return rawUrl;
	} catch {
		if (/^postgres(ql)?:\/\//i.test(rawUrl)) {
			if (/([?&])sslmode=/i.test(rawUrl)) {
				return rawUrl.replace(
					/([?&])sslmode=[^&]*/i,
					'$1sslmode=require',
				);
			}

			return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}sslmode=require`;
		}

		return rawUrl;
	}
}

export function mikroOrmConfigForRuntime(): Options {
	const clientUrl = databaseUrlForRuntime();
	if (!clientUrl) {
		throw InfrastructureErrorFactory.create(
			SYSTEM_INFRA_ERRORS.DATABASE_URL_REQUIRED,
		);
	}

	const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
	const forceSsl =
		process.env.DB_FORCE_SSL === 'true' ||
		(process.env.DB_FORCE_SSL !== 'false' && isLambdaRuntime);

	const backendRoot = findBackendRoot();

	return defineConfig({
		clientUrl,
		namingStrategy: UnderscoreNamingStrategy,
		baseDir: backendRoot,
		preferTs: shouldPreferTs(),
		entities: [
			path.join(backendRoot, 'dist/src/modules/**/*.schema.js'),
			path.join(
				backendRoot,
				'dist/src/shared/idempotency/**/*.schema.js',
			),
		],
		entitiesTs: [
			path.join(backendRoot, 'src/modules/**/*.schema.ts'),
			path.join(backendRoot, 'src/shared/idempotency/**/*.schema.ts'),
		],
		pool: {
			min: 0,
			max: 2,
		},
		driverOptions: forceSsl
			? {
					connection: {
						ssl: {
							rejectUnauthorized: false,
						},
					},
				}
			: undefined,
		allowGlobalContext: false,
	});
}
