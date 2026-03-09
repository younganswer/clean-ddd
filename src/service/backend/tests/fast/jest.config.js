const base = require('../jest.base');

module.exports = {
	...base,
	displayName: 'fast',
	testRegex: 'tests/.*\\.spec\\.ts$',
	testPathIgnorePatterns: ['/tests/db/'],
};
