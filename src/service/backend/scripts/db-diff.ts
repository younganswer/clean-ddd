import 'reflect-metadata';

import { MikroORM } from '@mikro-orm/core';
import process from 'node:process';
import { mikroOrmConfigForRuntime } from '@/lib/database/mikro-orm.config';
import { checkPostgresSelect1 } from '@/scripts/_checks';
import { withRetries } from '@/scripts/_retry';

const RETRY = { attempts: 30, delayMs: 2_000 };

const databaseUrl = (): string => {
	const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
	if (!url || url.trim().length === 0) {
		throw new Error(
			'DATABASE_URL_DIRECT (or DATABASE_URL) is required (e.g. postgresql://...)',
		);
	}
	return url;
};

const main = async () => {
	// Ensure DB is reachable first (clearer error message than MikroORM init).
	const url = databaseUrl();
	await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
		await checkPostgresSelect1(url);
	});

	const orm = await MikroORM.init(mikroOrmConfigForRuntime());
	try {
		const generator = orm.getSchemaGenerator();
		const sql = await generator.getUpdateSchemaSQL({
			safe: true,
			wrap: false,
		});

		const normalized = sql.trim();
		if (normalized.length === 0) {
			console.log('schema diff: none');
			return;
		}

		console.log('schema diff (apply with care):');
		console.log(normalized);
	} finally {
		await orm.close(true);
	}
};

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`db:diff 실패: ${message}`);
	process.exitCode = 1;
});
