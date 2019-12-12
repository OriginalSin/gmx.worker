var _self = self || window,
    serverBase = _self.serverBase || 'maps.kosmosnimki.ru/',
    // serverProxy = serverBase + 'Plugins/ForestReport/proxy',
gmxProxy = '//maps.kosmosnimki.ru/ApiSave.ashx'; // let _app = {},
// loaderStatus = {},
// _sessionKeys = {},


var str = self.location.origin || '',
    _protocol = str.substring(0, str.indexOf('/')),
    syncParams = {},
    fetchOptions = {
  // method: 'post',
  // headers: {'Content-type': 'application/x-www-form-urlencoded'},
  mode: 'cors',
  redirect: 'follow',
  credentials: 'include'
};

var COMPARS = {
  WrapStyle: 'None',
  ftc: 'osm',
  srs: 3857
};

var setSyncParams = function setSyncParams(hash) {
  // установка дополнительных параметров для серверных запросов
  syncParams = hash;
};

var getSyncParams = function getSyncParams(stringFlag) {
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

var parseURLParams = function parseURLParams(str) {
  var sp = new URLSearchParams(str || location.search),
      out = {},
      arr = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = sp[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var p = _step.value;
      var k = p[0],
          z = p[1];

      if (z) {
        if (!out[k]) {
          out[k] = [];
        }

        out[k].push(z);
      } else {
        arr.push(k);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    main: arr,
    keys: out
  };
};

var utils = {
  extend: function extend(dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
      src = arguments[j];

      for (i in src) {
        dest[i] = src[i];
      }
    }

    return dest;
  },
  makeTileKeys: function makeTileKeys(it, ptiles) {
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
            tp: {
              z: t[0],
              x: t[1],
              y: t[2],
              v: t[3],
              s: t[4],
              d: t[5]
            }
          };
        } else {
          tiles[tk] = tile;
        }

        newTiles[tk] = true;
      } else {
        tiles[tk] = tile;
      }
    }

    return {
      tiles: tiles,
      newTiles: newTiles
    };
  },
  getZoomRange: function getZoomRange(info) {
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
  chkProtocol: function chkProtocol(url) {
    return url.substr(0, _protocol.length) === _protocol ? url : _protocol + url;
  },
  getFormBody: function getFormBody(par) {
    return Object.keys(par).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(par[key]);
    }).join('&');
  },
  chkResponse: function chkResponse(resp, type) {
    if (resp.status < 200 || resp.status >= 300) {
      // error
      return Promise.reject(resp);
    } else {
      var contentType = resp.headers.get('Content-Type');

      if (type === 'bitmap') {
        // get blob
        return resp.blob();
      } else if (contentType.indexOf('application/json') > -1) {
        // application/json; charset=utf-8
        return resp.json();
      } else if (contentType.indexOf('text/javascript') > -1) {
        // text/javascript; charset=utf-8
        return resp.text(); // } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
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
  // getJson: function(url, params, options) {
  getJson: function getJson(queue) {
    // log('getJson', _protocol, queue, Date.now())
    var params = queue.params || {};

    if (queue.paramsArr) {
      queue.paramsArr.forEach(function (it) {
        params = utils.extend(params, it);
      });
    }

    var par = utils.extend({}, params, syncParams),
        options = queue.options || {},
        opt = utils.extend({
      method: 'post',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      } // mode: 'cors',
      // redirect: 'follow',
      // credentials: 'include'

    }, fetchOptions, options, {
      body: utils.getFormBody(par)
    });
    return fetch(utils.chkProtocol(queue.url), opt).then(function (res) {
      return utils.chkResponse(res, options.type);
    }).then(function (res) {
      var out = {
        url: queue.url,
        queue: queue,
        load: true,
        res: res
      }; // if (queue.send) {
      // handler.workerContext.postMessage(out);
      // } else {

      return out; // }
    }).catch(function (err) {
      return {
        url: queue.url,
        queue: queue,
        load: false,
        error: err.toString()
      }; // handler.workerContext.postMessage(out);
    });
  },
  parseLayerProps: function parseLayerProps(prop) {
    // let ph = utils.getTileAttributes(prop);
    return utils.extend({
      properties: prop
    }, utils.getTileAttributes(prop), utils.parseMetaProps(prop)); // return ph;
  },
  parseMetaProps: function parseMetaProps(prop) {
    var meta = prop.MetaProperties || {},
        ph = {};
    ph.dataSource = prop.dataSource || prop.LayerID;

    if ('parentLayer' in meta) {
      // изменить dataSource через MetaProperties
      ph.dataSource = meta.parentLayer.Value || '';
    }

    ['srs', // проекция слоя
    'gmxProxy', // установка прокачивалки
    'filter', // фильтр слоя
    'isGeneralized', // флаг generalization
    'isFlatten', // флаг flatten
    'multiFilters', // проверка всех фильтров для обьектов слоя
    'showScreenTiles', // показывать границы экранных тайлов
    'dateBegin', // фильтр по дате начало периода
    'dateEnd', // фильтр по дате окончание периода
    'shiftX', // сдвиг всего слоя
    'shiftY', // сдвиг всего слоя
    'shiftXfield', // сдвиг растров объектов слоя
    'shiftYfield', // сдвиг растров объектов слоя
    'quicklookPlatform', // тип спутника
    'quicklookX1', // точки привязки снимка
    'quicklookY1', // точки привязки снимка
    'quicklookX2', // точки привязки снимка
    'quicklookY2', // точки привязки снимка
    'quicklookX3', // точки привязки снимка
    'quicklookY3', // точки привязки снимка
    'quicklookX4', // точки привязки снимка
    'quicklookY4' // точки привязки снимка
    ].forEach(function (k) {
      ph[k] = k in meta ? meta[k].Value : '';
    });

    if (ph.gmxProxy.toLowerCase() === 'true') {
      // проверка прокачивалки
      ph.gmxProxy = gmxProxy;
    }

    if ('parentLayer' in meta) {
      // фильтр слоя		// todo удалить после изменений вов вьювере
      ph.dataSource = meta.parentLayer.Value || prop.dataSource || '';
    }

    return ph;
  },
  getTileAttributes: function getTileAttributes(prop) {
    var tileAttributeIndexes = {},
        tileAttributeTypes = {};

    if (prop.attributes) {
      var attrs = prop.attributes,
          attrTypes = prop.attrTypes || null;

      if (prop.identityField) {
        tileAttributeIndexes[prop.identityField] = 0;
      }

      for (var a = 0; a < attrs.length; a++) {
        var key = attrs[a];
        tileAttributeIndexes[key] = a + 1;
        tileAttributeTypes[key] = attrTypes ? attrTypes[a] : 'string';
      }
    }

    return {
      tileAttributeTypes: tileAttributeTypes,
      tileAttributeIndexes: tileAttributeIndexes
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
*/

var _maps = {};

var getMapTree = function getMapTree(pars) {
  pars = pars || {};
  var hostName = pars.hostName || serverBase,
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
  }).then(function (json) {
    var out = parseTree(json.res);
    _maps[hostName] = _maps[hostName] || {};
    _maps[hostName][id] = out;
    return parseTree(out);
  });
};

var _iterateNodeChilds = function _iterateNodeChilds(node, level, out) {
  level = level || 0;
  out = out || {
    layers: []
  };

  if (node) {
    var type = node.type,
        content = node.content,
        props = content.properties;

    if (type === 'layer') {
      var ph = utils.parseLayerProps(props);
      ph.level = level;

      if (content.geometry) {
        ph.geometry = content.geometry;
      }

      out.layers.push(ph);
    } else if (type === 'group') {
      var childs = content.children || [];
      out.layers.push({
        level: level,
        group: true,
        childsLen: childs.length,
        properties: props
      });
      childs.map(function (it) {
        _iterateNodeChilds(it, level + 1, out);
      });
    }
  } else {
    return out;
  }

  return out;
};

var parseTree = function parseTree(json) {
  var out = {};

  if (json.Status === 'error') {
    out = json;
  } else if (json.Result && json.Result.content) {
    out = _iterateNodeChilds(json.Result);
    out.mapAttr = out.layers.shift();
  } // console.log('______json_out_______', out, json)


  return out;
};

var chkSignal = function chkSignal(signalName, signals, opt) {
  opt = opt || {};
  var sObj = signals[signalName];

  if (sObj) {
    sObj.abort();
  }

  sObj = signals[signalName] = new AbortController();
  sObj.signal.addEventListener('abort', function (ev) {
    return console.log('Отмена fetch:', ev);
  });
  opt.signal = sObj.signal;
  signals[signalName] = sObj;
  return opt;
};

var Requests = {
  chkSignal: chkSignal,
  COMPARS: COMPARS,
  setSyncParams: setSyncParams,
  getSyncParams: getSyncParams,
  parseURLParams: parseURLParams,
  getMapTree: getMapTree,
  getJson: utils.getJson // addDataSource,
  // removeDataSource,
  // getReportsCount,
  // getLayerItems

};

var load = function load(pars) {
  pars = pars || {};
  console.log('load:', pars);

  if (!pars.signals) {
    pars.signals = {};
  }

  return new Promise(function (resolve, reject) {
    var arr = [];
    var pb = pars.tiles;

    for (var i = 0, len = pb.length; i < len; i += 6) {
      arr.push(Requests.getJson({
        url: '//' + pars.hostName + '/TileSender.ashx',
        options: Requests.chkSignal('TileLoader', pars.signals, {
          mode: 'cors',
          credentials: 'include'
        }),
        paramsArr: [Requests.COMPARS, {
          z: pb[i],
          x: pb[i + 1],
          y: pb[i + 2],
          v: pb[i + 3],
          Level: pb[i + 4],
          Span: pb[i + 5],
          LayerName: pars.id // bboxes: JSON.stringify(bbox || [WORLDBBOX]),
          // generalizedTiles: false,
          // zoom: zoom

        }]
      }).then(function (json) {
        delete pars.signals.TileLoader;
        return json;
      }).catch(function (err) {
        console.error(err); // resolve('');
      }));
    }
  });
};

var TilesLoader = {
  load: load
};

var HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496,
    W = WORLDWIDTHFULL / 2,
    WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx';
var hosts = {},
    zoom = 3,
    bbox = null,
    // dataManagersLinks = {},
// hostBusy = {},
// needReq = {}
delay = 60000,
    intervalID = null,
    timeoutID = null;
var utils$1 = {
  now: function now() {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    timeoutID = setTimeout(chkVersion, 0);
  },
  stop: function stop() {
    console.log('stop:', intervalID, delay);

    if (intervalID) {
      clearInterval(intervalID);
    }

    intervalID = null;
  },
  start: function start(msec) {
    console.log('start:', intervalID, msec);

    if (msec) {
      delay = msec;
    }

    utils$1.stop();
    intervalID = setInterval(chkVersion, delay);
  }
}; // const COMPARS = {WrapStyle: 'None', ftc: 'osm', srs: 3857};
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

var chkHost = function chkHost(hostName) {
  console.log('chkVersion:', hostName, hosts);
  var hostLayers = hosts[hostName],
      ids = hostLayers.ids,
      arr = [];

  for (var name in ids) {
    var pt = ids[name],
        pars = {
      Name: name,
      Version: 'v' in pt ? pt.v : -1
    };

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
      generalizedTiles: false,
      zoom: zoom
    }]
  }).then(function (json) {
    delete hostLayers.signals.chkVersion;
    return json;
  }).catch(function (err) {
    console.error(err); // resolve('');
  });
};

var chkVersion = function chkVersion() {
  var _loop = function _loop(key) {
    chkHost(key).then(function (json) {
      if (json.error) {
        console.warn('chkVersion:', json.error);
      } else {
        var hostLayers = hosts[key],
            ids = hostLayers.ids,
            res = json.res;

        if (res.Status === 'ok' && res.Result) {
          res.Result.forEach(function (it) {
            var pt = ids[it.name],
                props = it.properties;

            if (props) {
              pt.v = props.LayerVersion;
              pt.properties = props;
              pt.geometry = it.geometry;
            }

            pt.tiles = it.tiles;
            pt.tilesOrder = it.tilesOrder;
            pt.tilePromises = TilesLoader.load(pt); // console.log('chkVersion ___:', id, pt, v);
          }); // resolve(res.Result.Key !== 'null' ? '' : res.Result.Key);
          // } else {
          // reject(json);

          console.log('chkVersion key:', key, hosts);
        }
      }
    });
  };

  // console.log('chkVersion:', id, hosts);
  for (var key in hosts) {
    _loop(key);
  }
};

var addSource = function addSource(pars) {
  pars = pars || {};
  var id = pars.id;

  if ('zoom' in pars) {
    zoom = pars.zoom;
  }

  if ('bbox' in pars) {
    bbox = pars.bbox;
  }

  if (id) {
    var hostName = pars.hostName || HOST;

    if (!hosts[hostName]) {
      hosts[hostName] = {
        ids: {},
        signals: {}
      };

      if (pars.apiKey) {
        hosts[hostName].apiKeyPromise = Requests.getJson({
          url: '//' + hostName + '/ApiKey.ashx',
          paramsArr: [Requests.COMPARS, {
            Key: pars.apiKey
          }]
        }).then(function (json) {
          // console.log('/ApiKey.ashx', json);
          var res = json.res;

          if (res.Status === 'ok' && res.Result) {
            hosts[hostName].Key = res.Result.Key;
            return hosts[hostName].Key;
          }
        });
      }
    }

    hosts[hostName].ids[id] = pars;

    if (!intervalID) {
      utils$1.start();
    }

    utils$1.now();
  } else {
    console.warn('Warning: Specify layer `id` and `hostName`', pars);
  } // console.log('addSource:', pars);


  return;
};

var removeSource = function removeSource(pars) {
  pars = pars || {};
  var id = pars.id;

  if (id) {
    var hostName = pars.hostName || HOST;

    if (hosts[hostName]) {
      delete hosts[hostName].ids[id];

      if (Object.keys(hosts[hostName].ids).length === 0) {
        delete hosts[hostName];
      }

      if (Object.keys(hosts).length === 0) {
        utils$1.stop();
      }
    }
  } else {
    console.warn('Warning: Specify layer id and hostName', pars);
  } // console.log('removeSource:', pars);
  //Requests.removeDataSource({id: message.layerID, hostName: message.hostName}).then((json) => {


  return;
};

var moveend = function moveend(pars) {
  pars = pars || {};
  console.log('moveend:', pars);

  if ('zoom' in pars) {
    zoom = pars.zoom;
  }

  if ('bbox' in pars) {
    bbox = pars.bbox;
  }

  utils$1.now();
  return;
};

var DataVersion = {
  moveend: moveend,
  removeSource: removeSource,
  addSource: addSource
};

var _self$1 = self;

(_self$1.on || _self$1.addEventListener).call(_self$1, 'message', function (e) {
  var message = e.data || e; // console.log('message ', e);

  switch (message.cmd) {
    case 'getLayerItems':
      Requests.getLayerItems({
        layerID: message.layerID
      }).then(function (json) {
        message.out = json;
        var pt = {};
        json.Result.fields.forEach(function (name, i) {
          pt[name] = i;
        });
        json.Result.fieldKeys = pt;

        _self$1.postMessage(message);
      });
      break;

    case 'getMap':
      Requests.getMapTree({
        mapId: message.mapID,
        hostName: message.hostName,
        search: message.search
      }).then(function (json) {
        message.out = json;

        _self$1.postMessage(message);
      });
      break;

    case 'setSyncParams':
      Requests.setSyncParams(message.syncParams);
      break;

    case 'getSyncParams':
      message.syncParams = Requests.getSyncParams(message.stringFlag);

      _self$1.postMessage(message);

      break;

    case 'addDataSource':
      DataVersion.addSource(message); // .then((json) => {
      // message.out = json;
      // _self.postMessage(message);
      // });

      break;

    case 'removeDataSource':
      DataVersion.removeSource({
        id: message.id,
        hostName: message.hostName
      });
      break;

    case 'moveend':
      DataVersion.moveend(message);
      break;

    default:
      console.warn('Неизвестная команда:', message.cmd);
      break;
  }
});
//# sourceMappingURL=web-worker-0.js.map
