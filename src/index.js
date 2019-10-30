import DataWorker from 'web-worker:./worker';
import Requests from './worker/Requests.js';

const dataWorker = new DataWorker();
const urlPars = Requests.parseURLParams();
		console.log('urlPars', urlPars);

//dataWorker.postMessage('Hello World!');
const Utils = {
	saveState: (data, key) => {
		key = key || 'Forest_';
		window.localStorage.setItem(key, JSON.stringify(data));
	},
	getState: key => {
		key = key || 'Forest_';
		return JSON.parse(window.localStorage.getItem(key)) || {};
	},

	isDelynkaLayer: (it) => {
		let out = false;
		if (it._gmx) {
			let attr = it._gmx.tileAttributeTypes;
			out = attr.snap && attr.FRSTAT;
		}
		return out;
	},
	isKvartalLayer: (it) => {
		let out = false;
		if (it._gmx) {
			let attr = it._gmx.tileAttributeTypes;
			out = attr.kv;
		}
		return out;
	},
	getLayerItems: (it, opt) => {
		dataWorker.onmessage = (res) => {
			let data = res.data,
				cmd = data.cmd,
				json = data.out,
				type = opt && opt.type || 'delynka';

			if (cmd === 'getLayerItems') {
				if (type === 'delynka') {
					// delItems.set(json.Result);
				// } else {
					// kvItems.set(json.Result);
				}
			}
			// console.log('onmessage', res);
		};
		dataWorker.postMessage({cmd: 'getLayerItems', layerID: it.options.layerID, opt: opt});
	},
	getReportsCount: (opt) => {
		dataWorker.onmessage = (res) => {
			let data = res.data,
				cmd = data.cmd,
				json = data.out;

			if (cmd === 'getReportsCount') {
				// reportsCount.set(json);
			}
		};
		dataWorker.postMessage({cmd: 'getReportsCount', opt: opt});
	},
	getMap: (opt) => {
        return new Promise((resolve, reject) => {

			dataWorker.onmessage = (res) => {
				let data = res.data,
					cmd = data.cmd,
					json = data.out;

				if (cmd === 'getMap') {
					resolve(json);
				}
		// console.log('onmessage', json);
			};
			dataWorker.postMessage({cmd: 'getMap', mapID: urlPars.main.length ? urlPars.main[0] : opt.mapID, search: location.search});
		});
	}

};

export {dataWorker, Utils};
