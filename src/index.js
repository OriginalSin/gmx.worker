	import DataWorker from 'web-worker:./worker';
// import DataWorker from 'web-worker:./DataWorker';
	// import DataWorker from 'web-worker:../worker';
 
const dataWorker = new DataWorker();
dataWorker.postMessage('Hello World!');
