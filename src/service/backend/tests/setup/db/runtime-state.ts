import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type DbRuntimeState = {
	containerName: string;
	createdBySetup: boolean;
};

const stateFilePath = resolve(process.cwd(), '.tmp/test-db-runtime.json');

export const writeDbRuntimeState = (state: DbRuntimeState): void => {
	mkdirSync(dirname(stateFilePath), { recursive: true });
	writeFileSync(stateFilePath, JSON.stringify(state), 'utf8');
};

export const readDbRuntimeState = (): DbRuntimeState | null => {
	try {
		const raw = readFileSync(stateFilePath, 'utf8');
		return JSON.parse(raw) as DbRuntimeState;
	} catch {
		return null;
	}
};

export const clearDbRuntimeState = (): void => {
	rmSync(stateFilePath, { force: true });
};
