/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: 'ts-jest/presets/default-esm',
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
};
