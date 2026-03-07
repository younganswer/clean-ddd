// @ts-check
import path from 'node:path';
import eslint from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ignoreExports = [
	'src/main.ts',
	'src/init.ts',
	'src/lib/lambda/**/*.ts',
	'tests/**/*.ts',
	'test-utils/**/*.ts',
].map((pattern) => path.join(import.meta.dirname, pattern));

export default tseslint.config(
	{
		ignores: ['eslint.config.mjs'],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			sourceType: 'commonjs',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			import: eslintPluginImport,
			'unused-imports': eslintPluginUnusedImports,
		},
		settings: {
			'import/resolver': {
				typescript: true,
				node: true,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'import/no-unused-modules': [
				'error',
				{
					unusedExports: true,
					ignoreExports,
				},
			],
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'error',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		files: ['src/modules/*/domains/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						'@/modules/*/application/**',
						'@/modules/*/presentation/**',
						'@/modules/*/infrastructure/**',
					],
				},
			],
		},
	},
	{
		files: ['src/modules/*/presentation/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: ['**/infrastructure/**'],
				},
			],
		},
	},
	{
		files: [
			'src/modules/{ordering,inventory,payments,shipping,users}/application/queries/**/*.ts',
			'src/bff/**/application/queries/**/*.ts',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						'**/domains/repositories/**',
						'**/infrastructure/repositories/**',
					],
				},
			],
		},
	},
	{
		files: ['src/modules/*/infrastructure/readers/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						'**/domains/repositories/**',
						'**/infrastructure/repositories/**',
					],
				},
			],
		},
	},
);
