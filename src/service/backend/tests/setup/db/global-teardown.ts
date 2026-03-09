import { clearDbRuntimeState, readDbRuntimeState } from './runtime-state';
import { spawnSync } from 'node:child_process';

const runDocker = (args: string[]): void => {
	const result = spawnSync('docker', args, { encoding: 'utf8' });
	if (result.error) {
		throw new Error(`docker command failed: ${result.error.message}`);
	}
	if (result.status !== 0) {
		const stderr = result.stderr?.trim() ?? '';
		throw new Error(`docker ${args.join(' ')} failed: ${stderr}`);
	}
};

export default (): void => {
	const state = readDbRuntimeState();
	if (!state) {
		return;
	}

	try {
		if (state.createdBySetup) {
			runDocker(['rm', '-f', state.containerName]);
		}
	} finally {
		clearDbRuntimeState();
	}
};
