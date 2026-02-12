import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { checkPostgresSelect1, getSqsQueueUrl } from './_checks';
import { withRetries } from './_retry';
import { normalizeQueueUrl } from './_url';

const RETRY = { attempts: 3, delayMs: 10_000 };

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

async function dockerComposeUp(): Promise<void> {
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
  ]);
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
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
      }
    });
  });
}

function runLongLived(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) {
  const child = spawn(command, args, {
    cwd: repoRoot(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
    detached: true,
  });
  return child;
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        server.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

async function pickAvailablePort(
  preferred: number,
  maxAttempts = 50,
): Promise<number> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = preferred + i;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(candidate)) return candidate;
  }
  throw new Error(`no available port found starting at ${preferred}`);
}

async function main() {
  const region = process.env.AWS_REGION ?? 'ap-northeast-2';
  const sqsEndpoint = process.env.SQS_ENDPOINT ?? 'http://localhost:45666';
  const queueName = process.env.SQS_QUEUE_NAME ?? 'OutboxDispatchQueue.fifo';

  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://app:app@localhost:54322/clean_ddd';

  const backendPort = process.env.DEV_BACKEND_PORT
    ? Number(process.env.DEV_BACKEND_PORT)
    : await pickAvailablePort(3000);
  const frontendPort = process.env.DEV_FRONTEND_PORT
    ? Number(process.env.DEV_FRONTEND_PORT)
    : await pickAvailablePort(8080);

  // 1) infra up
  await dockerComposeUp();

  // 2) health check (10s x 3)
  await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(databaseUrl);
  });

  const rawQueueUrl = await withRetries(
    { ...RETRY, label: 'SQS(Queue)' },
    async () => getSqsQueueUrl({ endpoint: sqsEndpoint, region, queueName }),
  );
  const queueUrl = normalizeQueueUrl(rawQueueUrl, sqsEndpoint);

  const commonAwsEnv = {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  };

  const backendEnv = {
    ...commonAwsEnv,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: String(backendPort),
    SQS_DISABLE_DELAY_SECONDS: process.env.SQS_DISABLE_DELAY_SECONDS ?? 'true',
    OUTBOX_POLLING_ENABLED: process.env.OUTBOX_POLLING_ENABLED ?? 'true',
    DATABASE_URL: databaseUrl,
    DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT ?? databaseUrl,
    SQS_ENDPOINT: sqsEndpoint,
    SQS_OUTBOX_QUEUE_URL: queueUrl,
  };

  // 3) migrations (always)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:migrate'],
    backendEnv,
  );

  // 3.5) seed (replace demo data deterministically)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:seed:local'],
    backendEnv,
  );

  // 4) run backend + frontend
  const backend = runLongLived(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'dev'],
    backendEnv,
  );

  const frontendEnv = {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      `http://localhost:${backendPort}/api/v1`,
  };
  const frontend = runLongLived(
    'corepack',
    [
      'pnpm',
      '--dir',
      'src/service/frontend',
      'dev',
      '-p',
      String(frontendPort),
    ],
    frontendEnv,
  );

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`\n${signal} 수신: dev 프로세스를 종료합니다...`);
    if (backend.pid) {
      try {
        process.kill(-backend.pid, 'SIGINT');
      } catch {
        // ignore
      }
    }
    if (frontend.pid) {
      try {
        process.kill(-frontend.pid, 'SIGINT');
      } catch {
        // ignore
      }
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise<void>((resolve, reject) => {
    const onExit = (name: string) => (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} exited with code ${code}`));
      }
    };

    backend.on('exit', onExit('backend'));
    frontend.on('exit', onExit('frontend'));
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`dev:local 실패: ${message}`);
  process.exitCode = 1;
});
