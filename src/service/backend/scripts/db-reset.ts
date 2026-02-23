import 'reflect-metadata';

import process from 'node:process';
import { Client } from 'pg';
import { checkPostgresSelect1 } from '@/scripts/_checks';
import { withRetries } from '@/scripts/_retry';
import { runDbInit } from '@/scripts/db-init';

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

const dropAllInPublic = async (client: Client): Promise<void> => {
	await client.query('begin;');
	try {
		await client.query('drop schema if exists public cascade;');
		await client.query('create schema public;');
		await client.query('grant all on schema public to public;');
		await client.query('commit;');
	} catch (error) {
		try {
			await client.query('rollback;');
		} catch {
			// ignore
		}
		throw error;
	}
};

const main = async () => {
	const url = databaseUrl();

	await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
		await checkPostgresSelect1(url);
	});

	const client = new Client({ connectionString: url });
	await client.connect();
	try {
		await dropAllInPublic(client);
	} finally {
		await client.end();
	}

	await runDbInit();
	console.log('db:reset complete');
};

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`db:reset 실패: ${message}`);
	process.exitCode = 1;
});
