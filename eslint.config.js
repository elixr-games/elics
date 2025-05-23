import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
	{
		files: [
			'src/**/*.{js,ts,tsx}',
			'__tests__/**/*.{js,ts,tsx}',
			'benchmarks/**/*.{js,ts,tsx}',
		],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2021,
				sourceType: 'module',
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				// Jest globals
				describe: 'readonly',
				test: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				jest: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			prettier,
		},
		rules: {
			...typescript.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'all',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'lines-between-class-members': ['warn', 'always'],
			'prettier/prettier': 'error',
		},
	},
];
