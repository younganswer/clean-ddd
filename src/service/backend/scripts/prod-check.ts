import { checkPostgresSelect1 } from '@/scripts/_checks';
import { withRetries } from '@/scripts/_retry';

const RETRY = { attempts: 3, delayMs: 10_000 };

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`필수 환경변수가 누락되었습니다: ${name}`);
  }
  return value;
};

const main = async () => {
  const pooled = requireEnv('DATABASE_URL_POOLED');
  const direct = requireEnv('DATABASE_URL_DIRECT');

  await withRetries({ ...RETRY, label: 'Neon(Pooled)' }, async () => {
    await checkPostgresSelect1(pooled);
  });

  await withRetries({ ...RETRY, label: 'Neon(Direct)' }, async () => {
    await checkPostgresSelect1(direct);
  });

  // eslint-disable-next-line no-console
  console.log('prod 체크 성공');
  // eslint-disable-next-line no-console
  console.log('- DATABASE_URL_POOLED: OK');
  // eslint-disable-next-line no-console
  console.log('- DATABASE_URL_DIRECT: OK');
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`prod 체크 실패 (10초 간격 3회 재시도 후): ${message}`);
  process.exitCode = 1;
});
