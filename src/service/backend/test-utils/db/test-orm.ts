import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig, MikroORM } from '@mikro-orm/postgresql';

export const createTestOrm = async (): Promise<MikroORM> => {
	if (process.env.RUN_DB_TESTS !== '1') {
		throw new Error('RUN_DB_TESTS=1 is required to run DB tests');
	}

	const clientUrl =
		process.env.TEST_DATABASE_URL ??
		process.env.DATABASE_URL_DIRECT ??
		process.env.DATABASE_URL;
	if (!clientUrl) {
		throw new Error(
			'TEST_DATABASE_URL (or DATABASE_URL_DIRECT/DATABASE_URL) is required for DB tests',
		);
	}

	const orm = await MikroORM.init(
		defineConfig({
			clientUrl,
			namingStrategy: UnderscoreNamingStrategy,
			entities: [
				'./dist/modules/**/*.schema.js',
				'./dist/shared/idempotency/**/*.schema.js',
			],
			entitiesTs: [
				'./src/modules/**/*.schema.ts',
				'./src/shared/idempotency/**/*.schema.ts',
			],
			migrations: {
				path: './dist/migrations',
				pathTs: './migrations',
			},
			pool: {
				min: 0,
				max: 1,
			},
			allowGlobalContext: false,
		}),
	);

	try {
		await orm.getMigrator().up();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (!message.includes('Migrator extension not registered')) {
			throw error;
		}
	}
	return orm;
};
