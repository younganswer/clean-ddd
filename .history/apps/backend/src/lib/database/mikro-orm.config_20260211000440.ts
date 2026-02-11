import type { Options } from '@mikro-orm/core';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import fs from 'node:fs';
import path from 'node:path';

function findBackendRoot(): string {
  const candidates = [process.cwd(), __dirname];

  for (const start of candidates) {
    let dir = path.resolve(start);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const hasNestCli = fs.existsSync(path.join(dir, 'nest-cli.json'));
      const hasSrc = fs.existsSync(path.join(dir, 'src'));

      if (hasNestCli && hasSrc) {
        return dir;
      }

      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  throw new Error(
    `Failed to locate backend root (nest-cli.json + src). cwd=${process.cwd()} dirname=${__dirname}`,
  );
}

function databaseUrlForRuntime(): string {
  return process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? '';
}

export function mikroOrmConfigForRuntime(): Options {
  const clientUrl = databaseUrlForRuntime();
  if (!clientUrl) {
    throw new Error('DATABASE_URL_POOLED (or DATABASE_URL) is required');
  }

  const backendRoot = findBackendRoot();

  return defineConfig({
    clientUrl,
    namingStrategy: UnderscoreNamingStrategy,
    baseDir: backendRoot,
    preferTs: true,
    entities: [
      path.join(backendRoot, 'dist/modules/**/*.schema.js'),
      path.join(backendRoot, 'dist/shared/idempotency/**/*.schema.js'),
    ],
    entitiesTs: [
      path.join(backendRoot, 'src/modules/**/*.schema.ts'),
      path.join(backendRoot, 'src/shared/idempotency/**/*.schema.ts'),
    ],
    migrations: {
      path: path.join(backendRoot, 'dist/migrations'),
      pathTs: path.join(backendRoot, 'migrations'),
    },
    pool: {
      min: 0,
      max: 2,
    },
    allowGlobalContext: false,
  });
}

export function mikroOrmConfigForMigrations(): Options {
  const clientUrl =
    process.env.DATABASE_URL_DIRECT ??
    process.env.DATABASE_URL_POOLED ??
    process.env.DATABASE_URL ??
    '';
  if (!clientUrl) {
    throw new Error(
      'DATABASE_URL_DIRECT (or DATABASE_URL_POOLED/DATABASE_URL) is required',
    );
  }

  const backendRoot = findBackendRoot();

  return defineConfig({
    clientUrl,
    namingStrategy: UnderscoreNamingStrategy,
    baseDir: backendRoot,
    preferTs: true,
    entities: [
      path.join(backendRoot, 'dist/modules/**/*.schema.js'),
      path.join(backendRoot, 'dist/shared/idempotency/**/*.schema.js'),
    ],
    entitiesTs: [
      path.join(backendRoot, 'src/modules/**/*.schema.ts'),
      path.join(backendRoot, 'src/shared/idempotency/**/*.schema.ts'),
    ],
    migrations: {
      path: path.join(backendRoot, 'dist/migrations'),
      pathTs: path.join(backendRoot, 'migrations'),
    },
    pool: {
      min: 1,
      max: 2,
    },
    allowGlobalContext: false,
  });
}
