import webWorkerLoader from './scripts/index.js';

export default {
    input: 'src/index.js',
	output: {
		sourcemap: true,
		format: 'iife',
		file: 'dist/gmxWorker.js'
	},

    plugins: [ 
        webWorkerLoader({
			inline: false,		// should the worker code be inlined (Base64). Default: true
			loadPath: 'dist'	// this options is useful when the worker scripts need to be loaded from another folder.
		}),
    ]
};
