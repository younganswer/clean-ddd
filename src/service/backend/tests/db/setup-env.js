const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const testsEnvPath = path.resolve(__dirname, '../.env');
const testsEnvExamplePath = path.resolve(__dirname, '../.env.example');

if (fs.existsSync(testsEnvExamplePath)) {
	dotenv.config({ path: testsEnvExamplePath });
}

if (fs.existsSync(testsEnvPath)) {
	dotenv.config({ path: testsEnvPath, override: true });
}

process.env.RUN_DB_TESTS = process.env.RUN_DB_TESTS ?? '1';
process.env.TEST_DB_HOST_PORT = process.env.TEST_DB_HOST_PORT ?? '55432';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME ?? 'clean_ddd_test';
process.env.TEST_DB_USER = process.env.TEST_DB_USER ?? 'app';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'app';

const fallbackUrl = `postgresql://${process.env.TEST_DB_USER}:${process.env.TEST_DB_PASSWORD}@127.0.0.1:${process.env.TEST_DB_HOST_PORT}/${process.env.TEST_DB_NAME}`;

process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? fallbackUrl;
process.env.DATABASE_URL_PRIMARY =
	process.env.DATABASE_URL_PRIMARY ?? process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL =
	process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
