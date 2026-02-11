import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig, MikroORM } from '@mikro-orm/postgresql';

export async function createTestOrm(): Promise<MikroORM> {
  if (process.env.RUN_DB_TESTS !== '1') {
    throw new Error('RUN_DB_TESTS=1 is required to run DB tests');
  }

  const clientUrl = process.env.TEST_DATABASE_URL;
  if (!clientUrl) {
    throw new Error('TEST_DATABASE_URL is required for DB tests');
  }

  const orm = await MikroORM.init(
    defineConfig({
      clientUrl,
      namingStrategy: UnderscoreNamingStrategy,
      entities: ['./dist/**/*.schema.js'],
      entitiesTs: ['./src/**/*.schema.ts'],
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

  await orm.getMigrator().up();
  return orm;
}
