(function () {
    'use strict';

    const kIsNodeJS = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
    const kRequire = kIsNodeJS ? module.require : null; // eslint-disable-line

    function createURLWorkerFactory(url) {
        if (kIsNodeJS) {
            /* node.js */
            const Worker = kRequire('worker_threads').Worker; // eslint-disable-line
            return function WorkerFactory(options) {
                return new Worker(url, options);
            };
        }
        /* browser */
        return function WorkerFactory(options) {
            return new Worker(url, options);
        };
    }

    /* eslint-disable */
    const WorkerFactory = createURLWorkerFactory('dist/web-worker-0.js');
    /* eslint-enable */

    // import DataWorker from 'web-worker:./DataWorker';
    	// import DataWorker from 'web-worker:../worker';
     
    const dataWorker = new WorkerFactory();
    dataWorker.postMessage('Hello World!');

}());
//# sourceMappingURL=gmxWorker.js.map
