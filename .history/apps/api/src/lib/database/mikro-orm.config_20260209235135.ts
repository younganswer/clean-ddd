import type { Options } from '@mikro-orm/core';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';

function databaseUrlForRuntime(): string {
  return process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? '';
}

export function mikroOrmConfigForRuntime(): Options {
  const clientUrl = databaseUrlForRuntime();
  if (!clientUrl) {
    throw new Error('DATABASE_URL_POOLED (or DATABASE_URL) is required');
  }

  return defineConfig({
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
      max: 2,
    },
    allowGlobalContext: false,
  });
}

export function mikroOrmConfigForMigrations(): Options {
  const clientUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? '';
  if (!clientUrl) {
    throw new Error('DATABASE_URL_DIRECT (or DATABASE_URL_POOLED/DATABASE_URL) is required');
  }

  return defineConfig({
    clientUrl,
    namingStrategy: UnderscoreNamingStrategy,
    entities: ['./dist/**/*.schema.js'],
    entitiesTs: ['./src/**/*.schema.ts'],
    migrations: {
      path: './dist/migrations',
      pathTs: './migrations',
    },
    pool: {
      min: 1,
      max: 2,
    },
    allowGlobalContext: false,
  });
}
