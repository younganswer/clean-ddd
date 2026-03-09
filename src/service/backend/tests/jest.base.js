const path = require('node:path');

module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	moduleNameMapper: {
		'^@/scripts/(.*)$': '<rootDir>/scripts/$1',
		'^@/tests/(.*)$': '<rootDir>/tests/$1',
		'^@/test-utils/(.*)$': '<rootDir>/test-utils/$1',
		'^@/(.*)$': '<rootDir>/src/$1',
		'^src/(.*)$': '<rootDir>/src/$1',
		'^tests/(.*)$': '<rootDir>/tests/$1',
		'^test-utils/(.*)$': '<rootDir>/test-utils/$1',
	},
	rootDir: path.resolve(__dirname, '..'),
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	testEnvironment: 'node',
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
};
