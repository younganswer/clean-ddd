const base = require('../jest.base');

module.exports = {
	...base,
	displayName: 'db',
	testRegex: 'tests/db/.*\\.spec\\.ts$',
	setupFiles: ['<rootDir>/tests/db/setup-env.js'],
	globalSetup: '<rootDir>/tests/setup/db/global-setup.ts',
	globalTeardown: '<rootDir>/tests/setup/db/global-teardown.ts',
	testTimeout: 30000,
};
