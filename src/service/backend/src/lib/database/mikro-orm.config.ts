import type { Options } from '@mikro-orm/core';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import fs from 'node:fs';
import path from 'node:path';

function findBackendRoot(): string {
  const candidates = [process.cwd(), __dirname];

  for (const start of candidates) {
    let dir = path.resolve(start);

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

function shouldPreferTs(): boolean {
  // `nest start --watch` compiles to `dist/` and runs Node on JS output;
  // in that mode, loading TS entity files will crash with a SyntaxError.
  if (__dirname.split(path.sep).includes('dist')) {
    return false;
  }

  // When running directly from TS (jest/tsx/ts-node), prefer TS entities.
  if (process.env.TS_NODE || process.env.TS_NODE_DEV || process.env.TSX) {
    return true;
  }

  return true;
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
    preferTs: shouldPreferTs(),
    entities: [
      path.join(backendRoot, 'dist/src/modules/**/*.schema.js'),
      path.join(backendRoot, 'dist/src/shared/idempotency/**/*.schema.js'),
    ],
    entitiesTs: [
      path.join(backendRoot, 'src/modules/**/*.schema.ts'),
      path.join(backendRoot, 'src/shared/idempotency/**/*.schema.ts'),
    ],
    pool: {
      min: 0,
      max: 2,
    },
    allowGlobalContext: false,
  });
}
