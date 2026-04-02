import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig, MikroORM } from '@mikro-orm/postgresql';

export const createTestOrm = async (): Promise<MikroORM> => {
	const clientUrl =
		process.env.TEST_DATABASE_URL ??
		process.env.DATABASE_URL_PRIMARY ??
		process.env.DATABASE_URL;
	if (!clientUrl) {
		throw new Error(
			'TEST_DATABASE_URL (or DATABASE_URL_PRIMARY/DATABASE_URL) is required for DB tests',
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
		if (message.includes('Migrator extension not registered')) {
			await orm.getSchemaGenerator().updateSchema();
			return orm;
		}

		throw new Error(`Failed to run DB test migrations: ${message}`);
	}
	return orm;
};
