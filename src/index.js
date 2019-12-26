import DataWorker from 'web-worker:./worker';
import Requests from './worker/Requests.js';
import L from 'leaflet';

const dataWorker = new DataWorker();
const urlPars = Requests.parseURLParams();
		console.log('urlPars', urlPars);

const WORLDWIDTHFULL = 40075016.685578496,
	W = WORLDWIDTHFULL / 2,
	// WORLDBBOX = JSON.stringify([[-W, -W, W, W]]);
	WORLDBBOX = [[-W, -W, W, W]];
//dataWorker.postMessage('Hello World!');
const Utils = {
	getBboxes: function(map) {
		if (map.options.allWorld) {
			return WORLDBBOX;
		}
		let bbox = map.getBounds(),
			ne = bbox.getNorthEast(),
			sw = bbox.getSouthWest();
		if ((ne.lng - sw.lng) > 180) {
			return WORLDBBOX;
		}
		let zoom = map.getZoom(),
			ts = L.gmxUtil.tileSizes[zoom],
			pb = {x: ts, y: ts},
			mbbox = L.bounds(
				L.CRS.EPSG3857.project(sw)._subtract(pb),
				L.CRS.EPSG3857.project(ne)._add(pb)
			),

			minY = mbbox.min.y, maxY = mbbox.max.y,
			minX = mbbox.min.x, maxX = mbbox.max.x,
			minX1 = null, maxX1 = null,
			ww = WORLDWIDTHFULL,
			size = mbbox.getSize(),
			out = [];

		if (size.x > ww) {
			return WORLDBBOX;
		}

		if (maxX > W || minX < -W) {
			var hs = size.x / 2,
				center = ((maxX + minX) / 2) % ww;

			center = center + (center > W ? -ww : (center < -W ? ww : 0));
			minX = center - hs; maxX = center + hs;
			if (minX < -W) {
				minX1 = minX + ww; maxX1 = W; minX = -W;
			} else if (maxX > W) {
				minX1 = -W; maxX1 = maxX - ww; maxX = W;
			}
		}
		out.push([minX, minY, maxX, maxY]);

		if (minX1) {
			out.push([minX1, minY, maxX1, maxY]);
		}
		return out;
		// return JSON.stringify(out);
	},

	setSyncParams: (syncParams) => {
		syncParams = syncParams || {};
		dataWorker.onmessage = (res) => {
			if (res.data.cmd === 'setSyncParams') {
				console.log('onmessage setSyncParams ', res);
			}
		};
		dataWorker.postMessage({cmd: 'setSyncParams', syncParams: syncParams});
	},
	getSyncParams: (stringFlag) => {
        return new Promise((resolve) => {
			dataWorker.onmessage = (res) => {
				if (res.data.cmd === 'getSyncParams') {
					resolve(res.data.syncParams);
					console.log('onmessage getSyncParams ', res);
				}
			};
			dataWorker.postMessage({cmd: 'getSyncParams', stringFlag: stringFlag});
		});
	},
	setDateInterval: (dateInterval, id, hostName) => {
		console.log('setDateInterval', dateInterval, id, hostName)

		return new Promise((resolve) => {
			dataWorker.onmessage = (res) => {
				if (res.data.cmd === 'setDateInterval') { resolve(res.data); }
			};
			dataWorker.postMessage({
				cmd: 'setDateInterval',
				id: id,
				hostName: hostName || 'maps.kosmosnimki.ru',
				dateBegin: Math.floor(dateInterval.beginDate.getTime() / 1000),
				dateEnd: Math.floor(dateInterval.endDate.getTime() / 1000)
			});
		});
	},
	getMap: (opt) => {
		opt = opt || {};
        return new Promise((resolve) => {
			let mapID = urlPars.main.length ? urlPars.main[0] : opt.mapID;
			// let mapID = urlPars.main.length ? urlPars.main[0] : opt.mapID, hostName: opt.hostName, search: location.search});

			dataWorker.onmessage = (res) => {
				let data = res.data,
					cmd = data.cmd,
					json = data.out;

				if (cmd === 'getMap') {
					resolve(json);
				}
		// console.log('onmessage', json);
			};
			dataWorker.postMessage({
				cmd: 'getMap',
				mapID: mapID
			});
		});
	}
};

L.Map.addInitHook(function () {
	let map = this;
	map
		.on('layeradd', (ev) => {
			if (ev.layer._gmx) {
				let layer = ev.layer,
					// gmxProps = layer.getGmxProperties(),
					_gmx = layer._gmx,
					dm = layer.getDataManager(),
					opt = dm.options,
					id = opt.name,
					hostName = opt.hostName,
					dtInterval = dm.getMaxDateInterval(),
					beginDate = dtInterval.beginDate || _gmx.beginDate,
					endDate = dtInterval.endDate || _gmx.endDate,
					pars = {
						cmd: 'addDataSource',
						id: id,
						// id: _gmx.layerID,
						// v: opt.LayerVersion,
						// gmxStyles: gmxProps.gmxStyles,
						hostName: hostName,
						bbox: Utils.getBboxes(map),
						zoom: map.getZoom()
					};
				if (window.apiKey && hostName === 'maps.kosmosnimki.ru') {
					pars.apiKey = window.apiKey;
				}
				if (beginDate) {
					pars.dateBegin = Math.floor(beginDate.getTime() / 1000);
				}
				if (endDate) {
					pars.dateEnd = Math.floor(endDate.getTime() / 1000);
				}
				if (map.options.generalized === false) {
					pars.generalizedTiles = false;
				}
// console.log('layeradd', opt, dm.getD);

				return new Promise((resolve) => {
					if (_gmx) {
						dataWorker.onmessage = (res) => {
							let data = res.data,
								cmd = data.cmd,
								json = data.out;

							if (cmd === 'addDataSource') {
								resolve(json);
							}
						};
						dataWorker.postMessage(pars);
						dm.on('onDateInterval', (ev) => {
							Utils.setDateInterval({beginDate: ev.beginDate, endDate: ev.endDate}, id, hostName);
						});

					} else {
						resolve({error: 'Not Geomixer layer'});
					}
				});
			}
		})
		.on('moveend', () => {
			dataWorker.postMessage({
				cmd: 'moveend',
				bbox: Utils.getBboxes(map),
				zoom: map.getZoom()
			});
		})
		.on('layerremove', (ev) => {
	// console.log('layerremove', ev);
			let it = ev.layer,
				_gmx = it._gmx;

			return new Promise((resolve) => {
				if (_gmx) {
					dataWorker.onmessage = (res) => {
						let data = res.data,
							cmd = data.cmd,
							json = data.out;

						if (cmd === 'removeDataSource') {
							resolve(json);
						}
					};
					dataWorker.postMessage({cmd: 'removeDataSource', id: _gmx.layerID, hostName: _gmx.hostName});
				} else {
					resolve({error: 'Not Geomixer layer'});
				}
			});
		});
	Utils.getMap()
		.then(console.log)

});

L.gmxWorker = Utils;

export {dataWorker, Utils};