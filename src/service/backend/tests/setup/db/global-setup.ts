import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import { writeDbRuntimeState } from './runtime-state';

const runDocker = (args: string[]): { stdout: string; stderr: string } => {
	const result = spawnSync('docker', args, { encoding: 'utf8' });
	if (result.error) {
		throw new Error(`docker command failed: ${result.error.message}`);
	}
	if (result.status !== 0) {
		const stderr = result.stderr?.trim() ?? '';
		throw new Error(`docker ${args.join(' ')} failed: ${stderr}`);
	}
	return {
		stdout: result.stdout?.trim() ?? '',
		stderr: result.stderr?.trim() ?? '',
	};
};

const sleep = async (ms: number): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

const waitForPostgres = async (
	connectionString: string,
	timeoutMs: number,
): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	let lastError = 'unknown';

	while (Date.now() < deadline) {
		const client = new Client({ connectionString });
		try {
			await client.connect();
			await client.query('SELECT 1');
			await client.end();
			return;
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error);
			await client.end().catch(() => undefined);
			await sleep(1000);
		}
	}

	throw new Error(
		`Timed out waiting for test PostgreSQL to become ready: ${lastError}`,
	);
};

export default async (): Promise<void> => {
	runDocker(['info']);

	const containerName =
		process.env.TEST_DB_CONTAINER_NAME ?? 'clean-ddd-backend-test-db';
	const hostPort = process.env.TEST_DB_HOST_PORT ?? '55432';
	const image = process.env.TEST_DB_IMAGE ?? 'postgres:16-alpine';
	const dbName = process.env.TEST_DB_NAME ?? 'clean_ddd_test';
	const dbUser = process.env.TEST_DB_USER ?? 'app';
	const dbPassword = process.env.TEST_DB_PASSWORD ?? 'app';
	const connectionString =
		process.env.TEST_DATABASE_URL ??
		`postgresql://${dbUser}:${dbPassword}@127.0.0.1:${hostPort}/${dbName}`;

	const containerId = runDocker([
		'ps',
		'-a',
		'--filter',
		`name=^/${containerName}$`,
		'--format',
		'{{.ID}}',
	]).stdout;

	let createdBySetup = false;

	if (!containerId) {
		runDocker([
			'run',
			'-d',
			'--name',
			containerName,
			'--label',
			'com.clean-ddd.managed-by=jest-db-setup',
			'-e',
			`POSTGRES_DB=${dbName}`,
			'-e',
			`POSTGRES_USER=${dbUser}`,
			'-e',
			`POSTGRES_PASSWORD=${dbPassword}`,
			'-p',
			`${hostPort}:5432`,
			image,
		]);
		createdBySetup = true;
	} else {
		const isRunning = runDocker([
			'inspect',
			'-f',
			'{{.State.Running}}',
			containerName,
		]).stdout;
		if (isRunning !== 'true') {
			runDocker(['start', containerName]);
		}
	}

	await waitForPostgres(connectionString, 60_000);
	writeDbRuntimeState({ containerName, createdBySetup });
};
