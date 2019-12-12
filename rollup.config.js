import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { eslint } from 'rollup-plugin-eslint';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

import webWorkerLoader from './scripts/index.js';

export default [
	{
		input: 'src/index.js',
		external: ['leaflet'],	
		output: {
			file: pkg.browser,
			format: 'iife',
			sourcemap: true,
			globals: {
				leaflet: 'L'
			},
			name: 'gmxWorker'
		},

		plugins: [ 
			webWorkerLoader({
				inline: false,		// should the worker code be inlined (Base64). Default: true
				loadPath: 'geomixer/external/gmx.worker/dist'	// this options is useful when the worker scripts need to be loaded from another folder.
			}),
			resolve(),
			commonjs(),
			json(),
			eslint(),
			babel({
				include: ['src/**'],
				exclude: 'node_modules/**'
			})
		]
	},
	{
		input: 'src/index.js',
		external: ['leaflet'],
		output: {
			file: pkg.main,
			format: 'cjs',
			sourcemap: true,
			globals: {
				leaflet: 'L'
			},		
		},
		plugins: [ 
			webWorkerLoader({
				inline: false,		// should the worker code be inlined (Base64). Default: true
				loadPath: 'geomixer/external/gmx.worker/dist'	// this options is useful when the worker scripts need to be loaded from another folder.
			}),
			resolve(),
			commonjs(),
			json(),
			eslint(),
			babel({
				include: ['src/**'],
				exclude: 'node_modules/**'
			})
		]
	}
];
