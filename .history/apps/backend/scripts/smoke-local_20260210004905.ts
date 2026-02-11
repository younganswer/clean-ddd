import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { checkPostgresSelect1, getSqsQueueUrl } from './_checks';
import { withRetries, sleep } from './_retry';

const RETRY_10S_3 = { attempts: 3, delayMs: 10_000 };

function repoRoot(): string {
  return path.resolve(__dirname, '../../..');
}

function shimsPnpmPath(): string {
  return path.join(repoRoot(), 'shims', 'pnpm');
}

async function run(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot(),
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function runLongLived(command: string, args: string[], env?: NodeJS.ProcessEnv) {
  return spawn(command, args, {
    cwd: repoRoot(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
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
      throw new Error(`${method} ${url} -> ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
    }

    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForHttpOk(url: string): Promise<void> {
  await withRetries({ attempts: 15, delayMs: 1_000, label: 'HTTP' }, async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1_500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`not ready: ${res.status} ${res.statusText}`);
    } finally {
      clearTimeout(timer);
    }
  });
}

async function main() {
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const sqsEndpoint = process.env.SQS_ENDPOINT ?? 'http://localhost:4566';
  const queueName = process.env.SQS_QUEUE_NAME ?? 'OutboxDispatchQueue.fifo';

  const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://app:app@localhost:5432/clean_ddd';

  // 1) infra up
  await run('docker', ['compose', '-f', 'docker-compose.local.yml', 'up', '-d', '--remove-orphans']);

  // 2) health: Postgres + SQS queue exists (10s x 3)
  await withRetries({ ...RETRY_10S_3, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(databaseUrl);
  });

  const queueUrl = await withRetries(
    { ...RETRY_10S_3, label: 'SQS(Queue)' },
    async () => getSqsQueueUrl({ endpoint: sqsEndpoint, region, queueName }),
  );

  const commonAwsEnv = {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  };

  const backendEnv = {
    ...commonAwsEnv,
    DATABASE_URL: databaseUrl,
    DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT ?? databaseUrl,
    SQS_ENDPOINT: sqsEndpoint,
    SQS_OUTBOX_QUEUE_URL: queueUrl,
  };

  // 3) migrate (always)
  await run(shimsPnpmPath(), ['--dir', 'apps/backend', 'db:migrate'], backendEnv);

  // 4) start servers
  const backend = runLongLived(shimsPnpmPath(), ['--dir', 'apps/backend', 'dev'], backendEnv);
  const frontend = runLongLived(
    shimsPnpmPath(),
    ['--dir', 'apps/frontend', 'dev', '-p', '3001'],
    {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1',
    },
  );

  const shutdown = async () => {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    await sleep(500);
    backend.kill('SIGKILL');
    frontend.kill('SIGKILL');
  };

  try {
    // 5) wait ready
    await waitForHttpOk('http://localhost:3000/api/v1/orders?limit=1');
    await waitForHttpOk('http://localhost:3001/');

    // 6) API flow
    const list1 = await fetchJson('GET', 'http://localhost:3000/api/v1/orders?limit=5');
    const created = await fetchJson('POST', 'http://localhost:3000/api/v1/orders', {
      amount: 1000,
      currency: 'KRW',
    });
    const orderId = created.orderId as string;

    const detail = await fetchJson('GET', `http://localhost:3000/api/v1/orders/${encodeURIComponent(orderId)}`);

    const intent = await fetchJson(
      'POST',
      `http://localhost:3000/api/v1/orders/${encodeURIComponent(orderId)}/payments/intents`,
      {
        simulateOutcome: 'SUCCEEDED',
        simulateDelaySeconds: '1',
      },
    );

    const list2 = await fetchJson('GET', 'http://localhost:3000/api/v1/orders?limit=5');

    // eslint-disable-next-line no-console
    console.log('\n[smoke] 성공');
    // eslint-disable-next-line no-console
    console.log({
      listCountBefore: Array.isArray(list1) ? list1.length : null,
      created,
      detail,
      intent,
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
