import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { checkPostgresSelect1, getSqsQueueUrl } from './_checks';
import { withRetries, sleep } from './_retry';
import { normalizeQueueUrl } from './_url';

const RETRY_10S_3 = { attempts: 3, delayMs: 10_000 };

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
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
    });
  });
}

function runLongLived(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) {
  return spawn(command, args, {
    cwd: repoRoot(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
    detached: true,
  });
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

async function fetchJson(method: string, url: string, body?: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `${method} ${url} -> ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
      );
    }

    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForHttpOk(url: string): Promise<void> {
  await withRetries(
    { attempts: 15, delayMs: 1_000, label: 'HTTP' },
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1_500);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok)
          throw new Error(`not ready: ${res.status} ${res.statusText}`);
      } finally {
        clearTimeout(timer);
      }
    },
  );
}

async function waitForTruthy<T>(
  label: string,
  fn: () => Promise<T | null | undefined>,
): Promise<T> {
  return withRetries({ attempts: 20, delayMs: 1_000, label }, async () => {
    const value = await fn();
    if (!value) throw new Error('not ready');
    return value as T;
  });
}

async function main() {
  const region = process.env.AWS_REGION ?? 'ap-northeast-2';
  const sqsEndpoint = process.env.SQS_ENDPOINT ?? 'http://localhost:45666';
  const queueName = process.env.SQS_QUEUE_NAME ?? 'OutboxDispatchQueue.fifo';

  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://app:app@localhost:54322/clean_ddd';

  const backendPort = process.env.SMOKE_BACKEND_PORT
    ? Number(process.env.SMOKE_BACKEND_PORT)
    : await pickAvailablePort(3000);
  const frontendPort = process.env.SMOKE_FRONTEND_PORT
    ? Number(process.env.SMOKE_FRONTEND_PORT)
    : await pickAvailablePort(8080);

  const apiBaseUrl = `http://localhost:${backendPort}/api/v1`;
  const frontendBaseUrl = `http://localhost:${frontendPort}`;

  // 1) infra up
  await dockerComposeUp();

  // 2) health: Postgres + SQS queue exists (10s x 3)
  await withRetries({ ...RETRY_10S_3, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(databaseUrl);
  });

  const rawQueueUrl = await withRetries(
    { ...RETRY_10S_3, label: 'SQS(Queue)' },
    async () => getSqsQueueUrl({ endpoint: sqsEndpoint, region, queueName }),
  );
  const queueUrl = normalizeQueueUrl(rawQueueUrl, sqsEndpoint);

  // 2.5) SQS send smoke (서버 올리기 전에 실패를 빠르게 감지)
  const sqs = new SQSClient({
    region,
    endpoint: sqsEndpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    },
  });
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        smoke: true,
        at: new Date().toISOString(),
      }),
      MessageGroupId: 'smoke',
      MessageDeduplicationId: `smoke-${Date.now()}`,
    }),
  );

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

  // 3) migrate (always)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:migrate'],
    backendEnv,
  );

  // 3.25) updatedAt trigger (covers nativeUpdate paths too)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:triggers'],
    backendEnv,
  );

  // 3.5) seed (replace demo data deterministically)
  await run(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'db:seed:local'],
    backendEnv,
  );

  // 4) start servers
  const backend = runLongLived(
    'corepack',
    ['pnpm', '--dir', 'src/service/backend', 'dev'],
    backendEnv,
  );

  const forceFrontend =
    (process.env.SMOKE_FORCE_FRONTEND ?? 'false') === 'true';
  const frontendLockPath = path.join(
    repoRoot(),
    'src',
    'service',
    'frontend',
    '.next',
    'dev',
    'lock',
  );
  const shouldStartFrontend = forceFrontend || !fs.existsSync(frontendLockPath);

  const frontend = shouldStartFrontend
    ? runLongLived(
        'corepack',
        [
          'pnpm',
          '--dir',
          'src/service/frontend',
          'dev',
          '-p',
          String(frontendPort),
        ],
        {
          NEXT_PUBLIC_API_BASE_URL:
            process.env.NEXT_PUBLIC_API_BASE_URL ?? apiBaseUrl,
        },
      )
    : undefined;

  const shutdown = async () => {
    if (backend.pid) {
      try {
        process.kill(-backend.pid, 'SIGINT');
      } catch {
        // ignore
      }
    }
    if (frontend?.pid) {
      try {
        process.kill(-frontend.pid, 'SIGINT');
      } catch {
        // ignore
      }
    }
    await sleep(500);

    if (backend.pid) {
      try {
        process.kill(-backend.pid, 'SIGKILL');
      } catch {
        // ignore
      }
    }
    if (frontend?.pid) {
      try {
        process.kill(-frontend.pid, 'SIGKILL');
      } catch {
        // ignore
      }
    }
  };

  try {
    // 5) wait ready
    await waitForHttpOk(`${apiBaseUrl}/orders?limit=1`);
    if (frontend) {
      await waitForHttpOk(`${frontendBaseUrl}/`);
    }

    // 6) API flow
    const list1 = await fetchJson('GET', `${apiBaseUrl}/orders?limit=5`);
    const created = await fetchJson('POST', `${apiBaseUrl}/orders`, {
      amount: 1000,
      currency: 'KRW',
    });
    const orderId = created.orderId as string;

    const detail = await fetchJson(
      'GET',
      `${apiBaseUrl}/orders/${encodeURIComponent(orderId)}`,
    );

    const intent = await fetchJson(
      'POST',
      `${apiBaseUrl}/orders/${encodeURIComponent(orderId)}/payments/intents`,
      {
        simulateOutcome: 'SUCCEEDED',
        simulateDelaySeconds: '1',
      },
    );

    const shipment = await waitForTruthy('Shipment', async () =>
      fetchJson(
        'GET',
        `${apiBaseUrl}/shipments/by-order/${encodeURIComponent(orderId)}`,
      ),
    );
    const reservations = await waitForTruthy<any[]>(
      'InventoryReservation',
      async () =>
        fetchJson(
          'GET',
          `${apiBaseUrl}/inventory/reservations?orderId=${encodeURIComponent(orderId)}`,
        ),
    );

    const list2 = await fetchJson('GET', `${apiBaseUrl}/orders?limit=5`);

    // eslint-disable-next-line no-console
    console.log('\n[smoke] 성공');
    // eslint-disable-next-line no-console
    console.log({
      ports: { backendPort, frontendPort },
      frontendStarted: Boolean(frontend),
      listCountBefore: Array.isArray(list1) ? list1.length : null,
      created,
      detail,
      intent,
      shipment,
      reservationsCount: Array.isArray(reservations)
        ? reservations.length
        : null,
      listCountAfter: Array.isArray(list2) ? list2.length : null,
    });
  } finally {
    await shutdown();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[smoke] 실패: ${message}`);
  process.exitCode = 1;
});
