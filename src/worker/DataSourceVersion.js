import Requests from './Requests';
import TilesLoader from './TilesLoader';

const HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496,
	W = WORLDWIDTHFULL / 2,
	WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx';

let hosts = {},
    zoom = 3,
    bbox = null,
	// dataManagersLinks = {},
    // hostBusy = {},
    // needReq = {}
    delay = 60000,
	intervalID = null,
    timeoutID = null;

const utils = {
    now: function() {
		if (timeoutID) { clearTimeout(timeoutID); }
		timeoutID = setTimeout(chkVersion, 0);
    },

    stop: function() {
		console.log('stop:', intervalID, delay);
        if (intervalID) { clearInterval(intervalID); }
        intervalID = null;
    },

    start: function(msec) {
		console.log('start:', intervalID, msec);
        if (msec) { delay = msec; }
        utils.stop();
        intervalID = setInterval(chkVersion, delay);
    }
};

// const COMPARS = {WrapStyle: 'None', ftc: 'osm', srs: 3857};

// const chkSignal = (signalName, signals, opt) => {
	// opt = opt || {};
	// let sObj = signals[signalName];
	
	// if (sObj) { sObj.abort(); }
	// sObj = signals[signalName] = new AbortController();
	// sObj.signal.addEventListener('abort', (ev) => console.log('Отмена fetch:', ev));
	// opt.signal = sObj.signal;
	// signals[signalName] = sObj;
	// return opt;
// };

const chkHost = (hostName) => {
	console.log('chkVersion:', hostName, hosts);
	let hostLayers = hosts[hostName],
		ids = hostLayers.ids,
		arr = [];

	for (let name in ids) {
		let pt = ids[name],
			pars = { Name: name, Version: 'v' in pt ? pt.v : -1 };
		if (pt.dateBegin) {
			pars.dateBegin = pt.dateBegin;
		}
		if (pt.dateEnd) {
			pars.dateEnd = pt.dateEnd;
		}
		arr.push(pars);
	}

	return Requests.getJson({
		url: '//' + hostName + SCRIPT,
		options: Requests.chkSignal('chkVersion', hostLayers.signals),
		paramsArr: [Requests.COMPARS, {
			layers: JSON.stringify(arr),
			bboxes: JSON.stringify(bbox || [WORLDBBOX]),
			// generalizedTiles: false,
			zoom: zoom
		}]
	}).then(json => {
		delete hostLayers.signals.chkVersion;
		return json;
	})
	.catch(err => {
		console.error(err);
		// resolve('');
	});
};
const chkVersion = () => {
	for (let host in hosts) {
		chkHost(host).then(json => {
			if (json.error) {
				console.warn('chkVersion:', json.error);
			} else {
				let hostLayers = hosts[host],
					ids = hostLayers.ids,
					res = json.res;
				if (res.Status === 'ok' && res.Result) {
					res.Result.forEach(it => {
						let pt = ids[it.name],
							props = it.properties;
						if (props) {
							pt.v = props.LayerVersion;
							pt.properties = props;
							pt.geometry = it.geometry;
						}
						pt.hostName = host;
						pt.tiles = it.tiles;
						pt.tilesOrder = it.tilesOrder;
						// pt.tilesPromise = 
						TilesLoader.load(pt);
						Promise.all(Object.values(pt.tilesPromise)).then((res) => {
				console.log('tilesPromise ___:', hosts, res);
						});

						// pt.tilesPromise.then(res => {
				// console.log('tilesPromise ___:', hosts, res);
						// });
				// console.log('chkVersion ___:', pt);
					});
					// resolve(res.Result.Key !== 'null' ? '' : res.Result.Key);
				// } else {
					// reject(json);
					// console.log('chkVersion key:', host, hosts);
				}
			}
		});
	}
};

const addSource = (pars) => {
	pars = pars || {};

	let id = pars.id;
	
	if ('zoom' in pars) { zoom = pars.zoom; }
	if ('bbox' in pars) { bbox = pars.bbox; }
		
	if (id) {
		let hostName = pars.hostName || HOST;
		if (!hosts[hostName]) {
			hosts[hostName] = {ids: {}, signals: {}};
			if (pars.apiKey) {
				hosts[hostName].apiKeyPromise = Requests.getJson({
					url: '//' + hostName + '/ApiKey.ashx',
					paramsArr: [Requests.COMPARS, {
						Key: pars.apiKey
					}]
				}).then((json) => {
					// console.log('/ApiKey.ashx', json);
					let res = json.res;
					if (res.Status === 'ok' && res.Result) {
						hosts[hostName].Key = res.Result.Key;
						return hosts[hostName].Key;
					}
				});
			}

		}
		hosts[hostName].ids[id] = pars;
        if (!intervalID) { utils.start(); }
		utils.now();
	} else {
		console.warn('Warning: Specify layer `id` and `hostName`', pars);
	}
// console.log('addSource:', pars);
	return;
};

const removeSource = (pars) => {
	pars = pars || {};

	let id = pars.id;
	if (id) {
		let hostName = pars.hostName || HOST;
		if (hosts[hostName]) {
			let pt = hosts[hostName].ids[id];
console.log('signals:', pt.signals, pt);
			if (pt.signals) {
				Object.values(pt.signals).forEach((it) => {
					it.abort();
				});
			}
			delete hosts[hostName].ids[id];
			if (Object.keys(hosts[hostName].ids).length === 0) { delete hosts[hostName]; }
			if (Object.keys(hosts).length === 0) { utils.stop(); }
		}
	} else {
		console.warn('Warning: Specify layer id and hostName', pars);
	}
// console.log('removeSource:', pars);
	//Requests.removeDataSource({id: message.layerID, hostName: message.hostName}).then((json) => {
	return;
};

const moveend = (pars) => {
	pars = pars || {};
console.log('moveend:', pars);
	
	if ('zoom' in pars) { zoom = pars.zoom; }
	if ('bbox' in pars) { bbox = pars.bbox; }
		
	utils.now();
	return;
};
const setDateInterval = (pars) => {
	pars = pars || {};
	let host = hosts[pars.hostName];
	if (host && host.ids[pars.id]) {
		host.ids[pars.id].dateBegin = pars.dateBegin;
		host.ids[pars.id].dateEnd = pars.dateEnd;
	}
	utils.now();

console.log('setDateInterval:', pars, hosts);
};

const getMapTree = (pars) => {
	pars = pars || {};
	let hostName = pars.hostName || HOST,
		host = hosts[hostName];

	return new Promise((resolve) => {
		if (host && host.layerTree) {
			resolve(host.layerTree);
		} else {
			Requests.getJson({
				url: '//' + hostName + '/Map/GetMapFolder',
				// options: {},
				params: {
					srs: 3857, 
					skipTiles: 'All',
					mapId: pars.mapID,
					folderId: 'root',
					visibleItemOnly: false
				}
			}).then(json => {
console.log('getMapTree:', hosts, json);
				if (!hosts[hostName]) { hosts[hostName] = {ids: {}, signals: {}}; }
				hosts[hostName].layerTree = json.res.Result;
				resolve(json);
			})
		}
	});
			// DataVersion.getMapTree({mapID: message.mapID, hostName: message.hostName, search: message.search}).then((json) => {

	// let host = hosts[pars.hostName];
	// if (host && host.ids[pars.id]) {
		// host.ids[pars.id].dateBegin = pars.dateBegin;
		// host.ids[pars.id].dateEnd = pars.dateEnd;
	// }
	// utils.now();

};

export default {
	getMapTree,
	setDateInterval,
	moveend,
	removeSource,
	addSource
};