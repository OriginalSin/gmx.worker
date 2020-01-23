import Requests from './Requests';
import TilesLoader from './TilesLoader';

const HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496,
	W = WORLDWIDTHFULL / 2,
	WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx',
	GMXPROXY = '//maps.kosmosnimki.ru/ApiSave.ashx',
	MINZOOM = 1,
	MAXZOOM = 22,
    STYLEKEYS = {
        marker: {
            server: ['image',   'angle',     'scale',     'minScale',     'maxScale',     'size',         'circle',     'center',     'color'],
            client: ['iconUrl', 'iconAngle', 'iconScale', 'iconMinScale', 'iconMaxScale', 'iconSize', 'iconCircle', 'iconCenter', 'iconColor']
        },
        outline: {
            server: ['color',  'opacity',   'thickness', 'dashes'],
            client: ['color',  'opacity',   'weight',    'dashArray']
        },
        fill: {
            server: ['color',     'opacity',   'image',       'pattern',     'radialGradient',     'linearGradient'],
            client: ['fillColor', 'fillOpacity', 'fillIconUrl', 'fillPattern', 'fillRadialGradient', 'fillLinearGradient']
        },
        label: {
            server: ['text',      'field',      'template',      'color',      'haloColor',      'size',          'spacing',      'align'],
            client: ['labelText', 'labelField', 'labelTemplate', 'labelColor', 'labelHaloColor', 'labelFontSize', 'labelSpacing', 'labelAlign']
        }
    },
    STYLEFUNCKEYS = {
        // iconUrl: 'iconUrlFunction',
        iconSize: 'iconSizeFunction',
        iconAngle: 'rotateFunction',
        iconScale: 'scaleFunction',
        iconColor: 'iconColorFunction',
        opacity: 'opacityFunction',
        fillOpacity: 'fillOpacityFunction',
        color: 'colorFunction',
        fillColor: 'fillColorFunction'
/*
    },

    STYLEFUNCERROR = {
        // iconUrl: function() { return ''; },
        iconSize: function() { return 8; },
        iconAngle: function() { return 0; },
        iconScale: function() { return 1; },
        iconColor: function() { return 0xFF; },
        opacity: function() { return 1; },
        fillOpacity: function() { return 0.5; },
        color: function() { return 0xFF; },
        fillColor: function() { return 0xFF; }
    },
    DEFAULTSTYLES = {
       MinZoom: 1,
       MaxZoom: 21,
       Filter: '',
       Balloon: '',
       DisableBalloonOnMouseMove: true,
       DisableBalloonOnClick: false,
       RenderStyle: {
            point: {    // old = {outline: {color: 255, thickness: 1}, marker:{size: 8}},
                color: 0xFF,
                weight: 1,
                iconSize: 8
            },
            linestring: {    // old = {outline: {color: 255, thickness: 1}},
                color: 0xFF,
                weight: 1
            },
            polygon: {    // old = {outline: {color: 255, thickness: 1}},
                color: 0xFF,
                weight: 1
            }
        }
*/
    };

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
    },
/*
    parseLayerProps: function(prop) {
		// let ph = utils.getTileAttributes(prop);
		return Requests.extend(
			{
				properties: prop
			},
			utils.getTileAttributes(prop),
			utils.parseStyles(prop),
			utils.parseMetaProps(prop)
		);
    },
*/
    parseFilter: function(str) {
		let regex1 = /"(.+?)" in \((.+?)\)/g,
			regex2 = /"(.+?)"/g,
			regexMath = /(floor\()/g,
			body = str ? str
				.replace(/[[\]]/g, '"')
				.replace(regex1, '[$2].includes(props[indexes[\'$1\']])')
				.replace(regex2, 'props[indexes[\'$1\']]')
				.replace(/=/g, '===')
				.replace(/\bAND\b/g, '&&')
				.replace(/\bOR\b/g, '||')
				.replace(regexMath, 'Math.$1')
				: true;
		return {
			filter: str,
			filterParsed: body,
			filterFun: new Function('props', 'indexes', 'return ' + body + ';')
		};
    },

// StyleManager.decodeOldStyles = function(props) {
    // var styles = props.styles,
		// arr = styles || [{MinZoom: 1, MaxZoom: 21, RenderStyle: StyleManager.DEFAULT_STYLE}],
		// type = props.type.toLocaleLowerCase(),
		// gmxStyles = {
			// attrKeys: {},
			// iconsUrl: {}
		// };
	// gmxStyles.styles = arr.map(function(it) {
        // var pt = {
            // Name: it.Name || '',
            // type: type || '',
			legend: false,
            // MinZoom: it.MinZoom || 0,
            // MaxZoom: it.MaxZoom || 18
        // };
		// pt.labelMinZoom = it.labelMinZoom || pt.MinZoom;
		// pt.labelMaxZoom = it.labelMaxZoom || pt.MaxZoom;

        // if ('Balloon' in it) {
            // pt.Balloon = it.Balloon;
			// var hash = StyleManager.getKeysHash(it.Balloon, 'Balloon');
			// if (Object.keys(hash).length) {
				// L.extend(gmxStyles.attrKeys, hash);
			// }
        // }
        // if (it.RenderStyle) {
            // var rt = StyleManager.decodeOldStyle(it.RenderStyle);
			// L.extend(gmxStyles.attrKeys, rt.attrKeys);
			// if (rt.style.iconUrl) { gmxStyles.iconsUrl[rt.style.iconUrl] = true; }
            // pt.RenderStyle = rt.style;
			// if (it.HoverStyle === undefined) {
				// var hoveredStyle = JSON.parse(JSON.stringify(pt.RenderStyle));
				// if (hoveredStyle.outline) { hoveredStyle.outline.thickness += 1; }
				// pt.HoverStyle = hoveredStyle;
			// } else if (it.HoverStyle === null) {
				// delete pt.HoverStyle;
			// } else {
				// var ht = StyleManager.decodeOldStyle(it.HoverStyle);
				// pt.HoverStyle = ht.style;
			// }
        // } else if (type === 'vector ') {
            // pt.RenderStyle = StyleManager.DEFAULT_STYLE;
		// }

        // if ('DisableBalloonOnMouseMove' in it) {
            // pt.DisableBalloonOnMouseMove = it.DisableBalloonOnMouseMove === false ? false : true;
        // }
        // if ('DisableBalloonOnClick' in it) {
            // pt.DisableBalloonOnClick = it.DisableBalloonOnClick || false;
        // }
        // if ('Filter' in it) {	// TODO: переделать на new Function = function(props, indexes, types)
// /*eslint-disable no-useless-escape */
            // pt.Filter = it.Filter;
            // var ph = L.gmx.Parsers.parseSQL(it.Filter.replace(/[\[\]]/g, '"'));
// /*eslint-enable */
			// TODO: need body for function ƒ (props, indexes, types)
            // if (ph) { pt.filterFunction = ph; }
        // }
		// return pt;
	// });
    // return gmxStyles;
// };

	decodeOldStyle: function(style) {   // Style Scanex->leaflet
		let st, i, len, key, key1,
			styleOut = {};
			// attrKeys = {},
			// type = '';

		for (key in STYLEKEYS) {
			let keys = STYLEKEYS[key];
			for (i = 0, len = keys.client.length; i < len; i++) {
				key1 = keys.client[i];
				if (key1 in style) {
					styleOut[key1] = style[key1];
				}
			}
			st = style[key];
			if (st && typeof (st) === 'object') {
				for (i = 0, len = keys.server.length; i < len; i++) {
					key1 = keys.server[i];
					if (key1 in st) {
						var newKey = keys.client[i],
							zn = st[key1];
						if (typeof (zn) === 'string') {
							// var hash = StyleManager.getKeysHash(zn, newKey);
							// if (Object.keys(hash).length) {
								// styleOut.common = false;
								// L.extend(attrKeys, hash);
							// }
							if (STYLEFUNCKEYS[newKey]) {
								// if (zn.match(/[^\d\.]/) === null) {
									// zn = Number(zn);
								// } else {
									//var func = L.gmx.Parsers.parseExpression(zn);
									// if (func === null) {
										// zn = STYLEFUNCERROR[newKey]();
									// } else {
										// styleOut[STYLEFUNCKEYS[newKey]] = func;
									// }
								// }
							}
						} else if (key1 === 'opacity') {
							zn /= 100;
						}
						styleOut[newKey] = zn;
					}
				}
			}
		}
		if (style.marker) {
			st = style.marker;
			if ('dx' in st || 'dy' in st) {
				var dx = st.dx || 0,
					dy = st.dy || 0;
				styleOut.iconAnchor = [-dx, -dy];    // For leaflet type iconAnchor
			}
		}
		for (key in style) {
			if (!STYLEKEYS[key]) {
				styleOut[key] = style[key];
			}
		}
		return styleOut;
/*
		return {
			style: styleOut,			// стиль
			// attrKeys: attrKeys,			// используемые поля атрибутов
			type: type					// 'polygon', 'line', 'circle', 'square', 'image'
		};
*/
	},

    parseStyles: (prop) => {
        let styles = prop.styles || [],
			// attr = prop.tileAttributeIndexes,
            out = styles.map(it => {
				return new Promise(resolve => {
					let data = utils.parseFilter(it.Filter || ''),
						renderStyle = it.RenderStyle;
						// iconUrl = renderStyle.iconUrl || (renderStyle.marker && renderStyle.marker.image);
					data.MinZoom = it.MinZoom || MINZOOM;
					data.MaxZoom = it.MaxZoom || MAXZOOM;
					if (renderStyle) {
						data.renderStyle = utils.decodeOldStyle(renderStyle);
					}

					// if (iconUrl) {
						// Requests.getBitMap(iconUrl).then(blob => {
							// console.log('dsddd', blob);
							// createImageBitmap(blob, {
								// premultiplyAlpha: 'none',
								// colorSpaceConversion: 'none'
							// }).then(imageBitmap => {
								// data.imageBitmap = imageBitmap;
								// resolve(data);
							// }).catch(console.warn);
							// resolve(data);
						// });
					// } else {
						resolve(data);
					// }
					// return data;
				})
			});
		return {
			stylesPromise: Promise.all(out)
		};
    },

    parseMetaProps: function(prop) {
        var meta = prop.MetaProperties || {},
            ph = {};
        ph.dataSource = prop.dataSource || prop.LayerID || '';
		[
			'srs',					// проекция слоя
			'dataSource',			// изменить dataSource через MetaProperties
			'gmxProxy',				// установка прокачивалки
			'filter',				// фильтр слоя
			'isGeneralized',		// флаг generalization
			'isFlatten',			// флаг flatten
			'multiFilters',			// проверка всех фильтров для обьектов слоя
			'showScreenTiles',		// показывать границы экранных тайлов
			'dateBegin',			// фильтр по дате начало периода
			'dateEnd',				// фильтр по дате окончание периода
			'shiftX',				// сдвиг всего слоя
			'shiftY',				// сдвиг всего слоя
			'shiftXfield',			// сдвиг растров объектов слоя
			'shiftYfield',			// сдвиг растров объектов слоя
			'quicklookPlatform',	// тип спутника
			'quicklookX1',			// точки привязки снимка
			'quicklookY1',			// точки привязки снимка
			'quicklookX2',			// точки привязки снимка
			'quicklookY2',			// точки привязки снимка
			'quicklookX3',			// точки привязки снимка
			'quicklookY3',			// точки привязки снимка
			'quicklookX4',			// точки привязки снимка
			'quicklookY4'			// точки привязки снимка
		].forEach((k) => {
			if (k in meta) {
				ph[k] = meta[k].Value || '';
			}
		});
		if (ph.gmxProxy && ph.gmxProxy.toLowerCase() === 'true') {		// проверка прокачивалки
			ph.gmxProxy = GMXPROXY;
		}
		if ('parentLayer' in meta) {					// изменить dataSource через MetaProperties
			ph.dataSource = meta.parentLayer.Value;
		}

        return ph;
    },

    getTileAttributes: function(prop) {
        let tileAttributeIndexes = {},
            tileAttributeTypes = {};
        if (prop.attributes) {
            let attrs = prop.attributes,
                attrTypes = prop.attrTypes || null;
            if (prop.identityField) { tileAttributeIndexes[prop.identityField] = 0; }
            for (let a = 0; a < attrs.length; a++) {
                let key = attrs[a];
                tileAttributeIndexes[key] = a + 1;
                tileAttributeTypes[key] = attrTypes ? attrTypes[a] : 'string';
            }
        }
        return {
            tileAttributeTypes: tileAttributeTypes,
            tileAttributeIndexes: tileAttributeIndexes
        };
    },

	getStyleNum: function(itemArr, layerAttr, zoom) {
		let indexes = layerAttr.tileAttributeIndexes;
		if (layerAttr.stylesParsed) {
			for (let i = 0, len = layerAttr.stylesParsed.length; i < len; i++) {
				let st = layerAttr.stylesParsed[i];
				if (zoom && (zoom < st.MinZoom || zoom > st.MaxZoom)) { continue; }
				if (st.filterFun(itemArr, indexes)) { return i; }
			}
		} else {
			return 0;
		}
		return -1;
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
							if (!pt.tileAttributeIndexes) {
								Requests.extend(pt, utils.getTileAttributes(props));
							}
						}
						pt.hostName = host;
						pt.tiles = it.tiles;
						pt.tilesOrder = it.tilesOrder;
						// pt.tilesPromise = 
						TilesLoader.load(pt);
						// Promise.all(Object.values(pt.tilesPromise)).then((res) => {
				// console.log('tilesPromise ___:', hosts, res);
						// });

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
	if (pars.vid) {
		let parseLayers = hosts[pars.vHostName || HOST].parseLayers;
		if (parseLayers) {
			let linkAttr = parseLayers.layersByID[pars.vid];
			Requests.extend(linkAttr, utils.parseStyles(linkAttr.properties));
			linkAttr.stylesPromise.then((res) => {
				linkAttr.styles = res;
			});
		}
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

let _checkObserversTimer = null;
const _waitCheckObservers = () => {
	if (_checkObserversTimer) { clearTimeout(_checkObserversTimer); }
	_checkObserversTimer = setTimeout(checkObservers, 25);
};
/*
const chkTiles = (opt) => {
	let	arr = [],
		tcnt = 0,
		pars = opt.observer.pars,
		// dateInterval = pars.dateInterval,
		obbox = pars.bbox;
	for (let i = 0, len = opt.tiles.length; i < len; i++) {
		let tile = opt.tiles[i],
			bbox = tile.bbox;
		if (bbox[0] > obbox.max.x || bbox[2] < obbox.min.x || bbox[1] > obbox.max.y || bbox[3] < obbox.min.y) {continue;}
		tcnt++;
	}
console.log('chkTiles _1______________:', tcnt, pars.zKey, opt); //, tile.z, tile.x, tile.y, tile.span, tile.level);
	return arr;

};
*/
const getStyleNum = (arr, styles, indexes, z) => {
	let out = -1;
	
};

const checkObservers = () => {
	console.log('checkObservers _______________:', hosts);
	Object.keys(hosts).forEach(host => {
		Object.keys(hosts[host].ids).forEach(layerID => {
			let	tData = hosts[host].ids[layerID],
				layerData = hosts[host].parseLayers.layersByID[layerID],
				styles = layerData.styles || [],
				oKeys = Object.keys(tData.observers),
				tilesPromise = tData.tilesPromise;
			if (tilesPromise) {
				Promise.all(Object.values(tilesPromise)).then((arrTiles) => {
					for (let i = 0, len = arrTiles.length; i < len; i++) {
						let tile = arrTiles[i],
							styleNums = tile.styleNums,
							itemsbounds = tile.itemsbounds;
						if (!styleNums) {styleNums = tile.styleNums = [];}
						if (!itemsbounds) {itemsbounds = tile.itemsbounds = [];}
						for (let j = 0, len1 = oKeys.length; j < len1; j++) {
							let zKey = oKeys[j],
								observer = tData.observers[zKey];

							if (!observer || !observer.bounds.intersects(tile.bounds)) {continue;}

							if (!observer.tcnt) {observer.tcnt = 0;}
							observer.tcnt++;
							observer.items = [];
							tile.values.forEach((it, n) => {
								let geo = it[it.length - 1],
									st = styleNums[n],
									bounds = itemsbounds[n];
								if (st === undefined) {st = styleNums[n] = getStyleNum(it, styles, tData.tileAttributeIndexes, observer.pars.z);}
								if (!bounds) {bounds = itemsbounds[n] = Requests.geoItemBounds(geo);}

								observer.items.push(it);
							});
						}
					}
		console.log('checkObservers _____1__________:', hosts);
				});
			}
		});
	});
};

const addObserver = (pars) => {

console.log('addObserver_______________:', pars, hosts);
	return new Promise((resolve) => {
		let layerID = pars.layerID,
			zKey = pars.zKey,
			host = hosts[pars.hostName || HOST],
			out = {};
		if (host && host.parseLayers.layersByID[layerID]) {
			// let stData = host.parseLayers.layersByID[layerID],
			let	tData = host.ids[layerID];
			if (!tData.observers) { tData.observers = {}; }
			tData.observers[zKey] = {
				bounds: Requests.bounds().extendBounds(pars.bbox),
				pars: pars,
				resolver: resolve
			};
// console.log('addObserver ____1_______:', stData, tData);
			// start Recheck Observers on next frame
			_waitCheckObservers();
			// out.data = layerID;
			// resolve(out);
		} else {
			out.error = 'Нет слоя: ' + layerID;
			resolve(out);
		}
	});
};

const removeObserver = (pars) => {
	let host = hosts[pars.hostName];
	if (host && host.ids[pars.layerID]) {
		let observers = host.ids[pars.layerID].observers;
		if (observers) {
			observers[pars.zKey].resolver([]);
			delete observers[pars.zKey];
		}
	}
console.log('removeObserver _______________:', pars, hosts);
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

const _iterateNodeChilds = (node, level, out) => {
	level = level || 0;
	out = out || {
		layers: [],
		layersByID: {}
	};
	
	if (node) {
		let type = node.type,
			content = node.content,
			props = content.properties;
		if (type === 'layer') {
			let ph = {
				properties: props,
				level: level
			};
			// let ph = utils.parseLayerProps(props);
			// ph.level = level;
			if (content.geometry) { ph.geometry = content.geometry; }
			out.layers.push(ph);
			out.layersByID[props.name] = ph;
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
				if (!hosts[hostName]) { hosts[hostName] = {ids: {}, signals: {}}; }
 console.log('getMapTree:', hosts, json);
				resolve(json);
				hosts[hostName].layerTree = json.res.Result;
				hosts[hostName].parseLayers = parseTree(json.res);
			})
		}
	});
};

export default {
	addObserver,
	removeObserver,
	getMapTree,
	setDateInterval,
	moveend,
	removeSource,
	addSource
};