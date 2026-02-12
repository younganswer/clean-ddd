import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { checkPostgresSelect1 } from './_checks';
import { withRetries } from './_retry';

const RETRY = { attempts: 10, delayMs: 2_000 };

function composeProject(): string {
  return (
    process.env.COMPOSE_PROJECT ??
    process.env.COMPOSE_PROJECT_NAME ??
    'clean-ddd'
  );
}

function repoRoot(): string {
  return path.resolve(__dirname, '../../../..');
}

async function run(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot(),
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
    });
  });
}

async function dockerComposeUpPostgres(): Promise<void> {
  const project = composeProject();
  await run('docker', [
    'compose',
    '-p',
    project,
    '-f',
    'src/infra/compose/docker-compose.deps.yml',
    'up',
    '-d',
    '--remove-orphans',
    'postgres',
  ]);
}

function localDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ?? 'postgresql://app:app@localhost:54322/clean_ddd'
  );
}

async function main() {
  const databaseUrl = localDatabaseUrl();

  // 1) postgres up
  await dockerComposeUpPostgres();

  // 2) wait until ready
  await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(databaseUrl);
  });

  // 3) migrate (includes seed migration)
  const env = {
    DATABASE_URL: databaseUrl,
    DATABASE_URL_POOLED: process.env.DATABASE_URL_POOLED ?? databaseUrl,
    DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT ?? databaseUrl,
  };

  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:migrate'],
    env,
  );

  // 3.5) updatedAt trigger (covers nativeUpdate paths too)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:triggers'],
    env,
  );

  // 4) seed (replace demo data deterministically)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:seed:local'],
    env,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`db:setup:local 실패: ${message}`);
  process.exitCode = 1;
});
