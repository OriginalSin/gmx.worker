
const	_self = self || window;
		// serverBase = _self.serverBase || 'maps.kosmosnimki.ru/',
		// serverProxy = serverBase + 'Plugins/ForestReport/proxy',
		// gmxProxy = '//maps.kosmosnimki.ru/ApiSave.ashx';

// let _app = {},
	// loaderStatus = {},
	// _sessionKeys = {},
let str = _self.location.origin || '',
	_protocol = str.substring(0, str.indexOf('/')),
	syncParams = {},
	fetchOptions = {
		// method: 'post',
		// headers: {'Content-type': 'application/x-www-form-urlencoded'},
		mode: 'cors',
		// redirect: 'follow',
		credentials: 'include'
	};

const COMPARS = {WrapStyle: 'None', ftc: 'osm', srs: 3857};

const setSyncParams = (hash) => {	// установка дополнительных параметров для серверных запросов
	syncParams = hash;
};
const getSyncParams = (stringFlag) => {
	var res = syncParams;
	if (stringFlag) {
		var arr = [];
		for (var key in res) {
			arr.push(key + '=' + res[key]);
		}
		res = arr.join('&');
	}
	return res;
};

const parseURLParams = (str) => {
	let sp = new URLSearchParams(str || location.search),
		out = {},
		arr = [];
	for (let p of sp) {
		let k = p[0], z = p[1];
		if (z) {
			if (!out[k]) {out[k] = [];}
			out[k].push(z);
		} else {
			arr.push(k);
		}
	}
	return {main: arr, keys: out};
};
let utils = {
	extend: function (dest) {
		var i, j, len, src;

		for (j = 1, len = arguments.length; j < len; j++) {
			src = arguments[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},

	makeTileKeys: function(it, ptiles) {
		var tklen = it.tilesOrder.length,
			arr = it.tiles,
			tiles = {},
			newTiles = {};

		while (arr.length) {
			var t = arr.splice(0, tklen),
				tk = t.join('_'),
				tile = ptiles[tk];
			if (!tile || !tile.data) {
				if (!tile) {
					tiles[tk] = {
						tp: {z: t[0], x: t[1], y: t[2], v: t[3], s: t[4], d: t[5]}
					};
				} else {
					tiles[tk] = tile;
				}
				newTiles[tk] = true;
			} else {
				tiles[tk] = tile;
			}
		}
		return {tiles: tiles, newTiles: newTiles};
	},

	getZoomRange: function(info) {
		var arr = info.properties.styles,
			out = [40, 0];
		for (var i = 0, len = arr.length; i < len; i++) {
			var st = arr[i];
			out[0] = Math.min(out[0], st.MinZoom);
			out[1] = Math.max(out[1], st.MaxZoom);
		}
		out[0] = out[0] === 40 ? 1 : out[0];
		out[1] = out[1] === 0 ? 22 : out[1];
		return out;
	},

	chkProtocol: function(url) {
		return url.substr(0, _protocol.length) === _protocol ? url : _protocol + url;
	},
	getFormBody: function(par) {
		return Object.keys(par).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(par[key]); }).join('&');
	},
	chkResponse: function(resp, type) {
		if (resp.status < 200 || resp.status >= 300) {						// error
			return Promise.reject(resp);
		} else {
			var contentType = resp.headers.get('Content-Type');
			if (type === 'bitmap') {												// get blob
				return resp.blob();
			} else if (contentType.indexOf('application/json') > -1) {				// application/json; charset=utf-8
				return resp.json();
			} else if (contentType.indexOf('text/javascript') > -1) {	 			// text/javascript; charset=utf-8
				return resp.text();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.text();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.formData();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.arrayBuffer();
			// } else {
			}
		}
		return resp.text();
	},
	getBitMap: function(url) {
		let options = {type: 'bitmap'};
		return fetch(url, options)
		.then(function(res) {
			return utils.chkResponse(res, options.type);
		// })
		// .then(function(blob) {
			// return createImageBitmap(blob, {
				// premultiplyAlpha: 'none',
				// colorSpaceConversion: 'none'
			// });
		});
	},
	getTileJson: function(queue) {
		let params = queue.params || {};
		if (queue.paramsArr) {
			queue.paramsArr.forEach((it) => {
				params = utils.extend(params, it);
			});
		}
		let par = utils.extend({}, fetchOptions, COMPARS, params, syncParams),
			options = queue.options || {};
		return fetch(queue.url + '?' + utils.getFormBody(par))
		.then(function(res) {
			return utils.chkResponse(res, options.type);
		});
	},
	getJson: function(queue) {
		let params = queue.params || {};
		if (queue.paramsArr) {
			queue.paramsArr.forEach((it) => {
				params = utils.extend(params, it);
			});
		}
		let par = utils.extend({}, params, syncParams),
			options = queue.options || {},
			opt = utils.extend({
				method: 'post',
				headers: {'Content-type': 'application/x-www-form-urlencoded'}
			}, fetchOptions, options, {
				body: utils.getFormBody(par)
			});
		return fetch(utils.chkProtocol(queue.url), opt)
		.then(function(res) {
			return utils.chkResponse(res, options.type);
		})
		.then(function(res) {
			return {url: queue.url, queue: queue, load: true, res: res};
		})
		.catch(function(err) {
			return {url: queue.url, queue: queue, load: false, error: err.toString()};
			// handler.workerContext.postMessage(out);
		});
    },

	geoItemBounds: function(geo) {  // get item bounds array by geometry
        if (!geo) {
            return {
                bounds: null,
                boundsArr: []
            };
        }
        var type = geo.type,
            coords = geo.coordinates,
            b = null,
            i = 0,
            len = 0,
            bounds = null,
            boundsArr = [];
        if (type === 'MULTIPOLYGON' || type === 'MultiPolygon') {
            bounds = new Bounds();
            for (i = 0, len = coords.length; i < len; i++) {
                var arr1 = [];
                for (var j = 0, len1 = coords[i].length; j < len1; j++) {
                    b = new Bounds(coords[i][j]);
                    arr1.push(b);
                    if (j === 0) { bounds.extendBounds(b); }
                }
                boundsArr.push(arr1);
            }
        } else if (type === 'POLYGON' || type === 'Polygon') {
            bounds = new Bounds();
            for (i = 0, len = coords.length; i < len; i++) {
                b = new Bounds(coords[i]);
                boundsArr.push(b);
                if (i === 0) { bounds.extendBounds(b); }
            }
        } else if (type === 'POINT' || type === 'Point') {
            bounds = new Bounds([coords]);
        } else if (type === 'MULTIPOINT' || type === 'MultiPoint') {
            bounds = new Bounds();
            for (i = 0, len = coords.length; i < len; i++) {
                b = new Bounds([coords[i]]);
                bounds.extendBounds(b);
            }
        } else if (type === 'LINESTRING' || type === 'LineString') {
            bounds = new Bounds(coords);
            //boundsArr.push(bounds);
        } else if (type === 'MULTILINESTRING' || type === 'MultiLineString') {
            bounds = new Bounds();
            for (i = 0, len = coords.length; i < len; i++) {
                b = new Bounds(coords[i]);
                bounds.extendBounds(b);
                //boundsArr.push(b);
            }
        }
        return {
            bounds: bounds,
            boundsArr: boundsArr
        };
    }

};
/*
const requestSessionKey = (serverHost, apiKey) => {
	let keys = _sessionKeys;
	if (!(serverHost in keys)) {
		keys[serverHost] = new Promise(function(resolve, reject) {
			if (apiKey) {
				utils.getJson({
					url: '//' + serverHost + '/ApiKey.ashx',
					params: {WrapStyle: 'None', Key: apiKey}
				})
					.then(function(json) {
						let res = json.res;
						if (res.Status === 'ok' && res.Result) {
							resolve(res.Result.Key !== 'null' ? '' : res.Result.Key);
						} else {
							reject(json);
						}
					})
					.catch(function() {
						resolve('');
					});
			} else {
				resolve('');
			}
		});
	}
	return keys[serverHost];
};
let _maps = {};
const getMapTree = (pars) => {
	pars = pars || {};
	let hostName = pars.hostName || serverBase,
		id = pars.mapId;
	return utils.getJson({
		url: '//' + hostName + '/Map/GetMapFolder',
		// options: {},
		params: {
			srs: 3857, 
			skipTiles: 'All',

			mapId: id,
			folderId: 'root',
			visibleItemOnly: false
		}
	})
		.then(function(json) {
			let out = parseTree(json.res);
			_maps[hostName] = _maps[hostName] || {};
			_maps[hostName][id] = out;
			return parseTree(out);
		});
};
const getReq = url => {
	return fetch(url, {
			method: 'get',
			mode: 'cors',
			credentials: 'include'
		// headers: {'Accept': 'application/json'},
		// body: JSON.stringify(params)	// TODO: сервер почему то не хочет работать так https://googlechrome.github.io/samples/fetch-api/fetch-post.html
		})
		.then(res => res.json())
		.catch(err => console.warn(err));
};

// const getLayerItems = (params) => {
	// params = params || {};

	// let url = `${serverBase}VectorLayer/Search.ashx`;
	// url += '?layer=' + params.layerID;
	// if (params.id) { '&query=gmx_id=' + params.id; }

	// url += '&out_cs=EPSG:4326';
	// url += '&geometry=true';
	// return getReq(url);
// };
// const getReportsCount = () => {
	// return getReq(serverProxy + '?path=/rest/v1/get-current-user-info');
// };

let dataSources = {},
	loaderStatus1 = {};

const addDataSource = (pars) => {
	pars = pars || {};

	let id = pars.id;
	if (id) {
		let hostName = pars.hostName;
		
	} else {
		console.warn('Warning: Specify layer \'id\' and \'hostName\`', pars);
	}
console.log('addDataSource:', pars);
	return;
};

const removeDataSource = (pars) => {
	pars = pars || {};

	let id = pars.id;
	if (id) {
		let hostName = pars.hostName;
		
	} else {
		console.warn('Warning: Specify layer \'id\' and \'hostName\`', pars);
	}
console.log('removeDataSource:', pars);
	//Requests.removeDataSource({id: message.layerID, hostName: message.hostName}).then((json) => {
	return;
};
let _maps = {};
const getMapTree = (pars) => {
	pars = pars || {};
	let hostName = pars.hostName || 'maps.kosmosnimki.ru',
		id = pars.mapID;
	return utils.getJson({
		url: '//' + hostName + '/Map/GetMapFolder',
		// options: {},
		params: {
			srs: 3857, 
			skipTiles: 'All',

			mapId: id,
			folderId: 'root',
			visibleItemOnly: false
		}
	})
		// .then(function(json) {
			// let out = parseTree(json.res);
			// _maps[hostName] = _maps[hostName] || {};
			// _maps[hostName][id] = out;
			// return parseTree(out);
		// });
};

const _iterateNodeChilds = (node, level, out) => {
	level = level || 0;
	out = out || {
		layers: []
	};
	
	if (node) {
		let type = node.type,
			content = node.content,
			props = content.properties;
		if (type === 'layer') {
			let ph = utils.parseLayerProps(props);
			ph.level = level;
			if (content.geometry) { ph.geometry = content.geometry; }
			out.layers.push(ph);
		} else if (type === 'group') {
			let childs = content.children || [];
			out.layers.push({ level: level, group: true, childsLen: childs.length, properties: props });
			childs.map((it) => {
				_iterateNodeChilds(it, level + 1, out);
			});
		}
		
	} else {
		return out;
	}
	return out;
};

const parseTree = (json) => {
	let out = {};
	if (json.Status === 'error') {
		out = json;
	} else if (json.Result && json.Result.content) {
		out = _iterateNodeChilds(json.Result);
		out.mapAttr = out.layers.shift();
	}
// console.log('______json_out_______', out, json)
	return out;
};
*/

const chkSignal = (signalName, signals, opt) => {
	opt = opt || {};
	let sObj = signals[signalName];
// console.log('sssssss', sObj, signalName)
	if (sObj) { sObj.abort(); }
	sObj = signals[signalName] = new AbortController();
	sObj.signal.addEventListener('abort', (ev) => console.log('Отмена fetch:', ev));
	opt.signal = sObj.signal;
	signals[signalName] = sObj;
	return opt;
};

const Bounds = function(arr) {
    this.min = {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE
    };
    this.max = {
        x: -Number.MAX_VALUE,
        y: -Number.MAX_VALUE
    };
    this.extendArray(arr);
};
Bounds.prototype = {
    extend: function(x, y) {
        if (x < this.min.x) { this.min.x = x; }
        if (x > this.max.x) { this.max.x = x; }
        if (y < this.min.y) { this.min.y = y; }
        if (y > this.max.y) { this.max.y = y; }
        return this;
    },
    extendBounds: function(bounds) {
        return this.extendArray([[bounds.min.x, bounds.min.y], [bounds.max.x, bounds.max.y]]);
    },
    extendArray: function(arr) {
        if (!arr || !arr.length) { return this; }
        var i, len;
        if (typeof arr[0] === 'number') {
            for (i = 0, len = arr.length; i < len; i += 2) {
                this.extend(arr[i], arr[i + 1]);
            }
        } else {
            for (i = 0, len = arr.length; i < len; i++) {
                this.extend(arr[i][0], arr[i][1]);
            }
        }
        return this;
    },
    addBuffer: function(dxmin, dymin, dxmax, dymax) {
        this.min.x -= dxmin;
        this.min.y -= dymin || dxmin;
        this.max.x += dxmax || dxmin;
        this.max.y += dymax || dymin || dxmin;
        return this;
    },
    contains: function (point) { // ([x, y]) -> Boolean
        var min = this.min, max = this.max,
            x = point[0], y = point[1];
        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
    },
    getCenter: function () {
        var min = this.min, max = this.max;
        return [(min.x + max.x) / 2, (min.y + max.y) / 2];
    },
    addOffset: function (offset) {
        this.min.x += offset[0]; this.max.x += offset[0];
        this.min.y += offset[1]; this.max.y += offset[1];
        return this;
    },
    intersects: function (bounds) { // (Bounds) -> Boolean
        var min = this.min,
            max = this.max,
            min2 = bounds.min,
            max2 = bounds.max;
        return max2.x > min.x && min2.x < max.x && max2.y > min.y && min2.y < max.y;
    },
    intersectsWithDelta: function (bounds, dx, dy) { // (Bounds, dx, dy) -> Boolean
        var min = this.min,
            max = this.max,
            x = dx || 0,
            y = dy || 0,
            min2 = bounds.min,
            max2 = bounds.max;
        return max2.x + x > min.x && min2.x - x < max.x && max2.y + y > min.y && min2.y - y < max.y;
    },
    isEqual: function (bounds) { // (Bounds) -> Boolean
        var min = this.min,
            max = this.max,
            min2 = bounds.min,
            max2 = bounds.max;
        return max2.x === max.x && min2.x === min.x && max2.y === max.y && min2.y === min.y;
    },
    isNodeIntersect: function (coords) {
        for (var i = 0, len = coords.length; i < len; i++) {
            if (this.contains(coords[i])) {
                return {
                    num: i,
                    point: coords[i]
                };
            }
        }
        return null;
    }
};

    // bounds: function(arr) {
		// return new Bounds(arr);
    // },

export default {
	bounds: arr => new Bounds(arr),
	geoItemBounds: utils.geoItemBounds,
	chkSignal,
	COMPARS,
	setSyncParams,
	getSyncParams,
	parseURLParams,
	// getMapTree,
	extend: utils.extend,
	getBitMap: utils.getBitMap,
	getFormBody: utils.getFormBody,
	getTileJson: utils.getTileJson,
	getJson: utils.getJson
	// addDataSource,
	// removeDataSource,
	// getReportsCount,
	// getLayerItems
};