import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
	input: 'lib/index.js',
	plugins: [resolve(), commonjs()],
	output: [
		// UMD build
		{
			file: 'build/elics.js',
			format: 'umd',
			name: 'Ratk',
		},
		// Minified UMD build
		{
			file: 'build/elics.min.js',
			format: 'umd',
			name: 'Ratk',
			plugins: [terser()],
		},
		// ES module build
		{
			file: 'build/elics.module.js',
			format: 'es',
		},
		// Minified ES module build
		{
			file: 'build/elics.module.min.js',
			format: 'es',
			plugins: [terser()],
		},
	],
};
