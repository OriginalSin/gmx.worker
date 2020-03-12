var _self = self || window; // serverBase = _self.serverBase || 'maps.kosmosnimki.ru/',
// serverProxy = serverBase + 'Plugins/ForestReport/proxy',
// gmxProxy = '//maps.kosmosnimki.ru/ApiSave.ashx';
// let _app = {},
// loaderStatus = {},
// _sessionKeys = {},


var str = _self.location.origin || '',
    _protocol = str.substring(0, str.indexOf('/')),
    syncParams = {},
    fetchOptions = {
  // method: 'post',
  // headers: {'Content-type': 'application/x-www-form-urlencoded'},
  mode: 'cors',
  // redirect: 'follow',
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
  getBitMap: function getBitMap(url) {
    var options = {
      type: 'bitmap'
    };
    return fetch(url, options).then(function (res) {
      return utils.chkResponse(res, options.type); // })
      // .then(function(blob) {
      // return createImageBitmap(blob, {
      // premultiplyAlpha: 'none',
      // colorSpaceConversion: 'none'
      // });
    });
  },
  getTileJson: function getTileJson(queue) {
    var params = queue.params || {};

    if (queue.paramsArr) {
      queue.paramsArr.forEach(function (it) {
        params = utils.extend(params, it);
      });
    }

    var par = utils.extend({}, fetchOptions, COMPARS, params, syncParams),
        options = queue.options || {};
    return fetch(queue.url + '?' + utils.getFormBody(par)).then(function (res) {
      return utils.chkResponse(res, options.type);
    });
  },
  getJson: function getJson(queue) {
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
      }
    }, fetchOptions, options, {
      body: utils.getFormBody(par)
    });
    return fetch(utils.chkProtocol(queue.url), opt).then(function (res) {
      return utils.chkResponse(res, options.type);
    }).then(function (res) {
      return {
        url: queue.url,
        queue: queue,
        load: true,
        res: res
      };
    }).catch(function (err) {
      return {
        url: queue.url,
        queue: queue,
        load: false,
        error: err.toString()
      }; // handler.workerContext.postMessage(out);
    });
  },
  geoItemBounds: function geoItemBounds(geo) {
    // get item bounds array by geometry
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

          if (j === 0) {
            bounds.extendBounds(b);
          }
        }

        boundsArr.push(arr1);
      }
    } else if (type === 'POLYGON' || type === 'Polygon') {
      bounds = new Bounds();

      for (i = 0, len = coords.length; i < len; i++) {
        b = new Bounds(coords[i]);
        boundsArr.push(b);

        if (i === 0) {
          bounds.extendBounds(b);
        }
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
      bounds = new Bounds(coords); //boundsArr.push(bounds);
    } else if (type === 'MULTILINESTRING' || type === 'MultiLineString') {
      bounds = new Bounds();

      for (i = 0, len = coords.length; i < len; i++) {
        b = new Bounds(coords[i]);
        bounds.extendBounds(b); //boundsArr.push(b);
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

var chkSignal = function chkSignal(signalName, signals, opt) {
  opt = opt || {};
  var sObj = signals[signalName]; // console.log('sssssss', sObj, signalName)

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

var Bounds = function Bounds(arr) {
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
  extend: function extend(x, y) {
    if (x < this.min.x) {
      this.min.x = x;
    }

    if (x > this.max.x) {
      this.max.x = x;
    }

    if (y < this.min.y) {
      this.min.y = y;
    }

    if (y > this.max.y) {
      this.max.y = y;
    }

    return this;
  },
  extendBounds: function extendBounds(bounds) {
    return this.extendArray([[bounds.min.x, bounds.min.y], [bounds.max.x, bounds.max.y]]);
  },
  extendArray: function extendArray(arr) {
    if (!arr || !arr.length) {
      return this;
    }

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
  addBuffer: function addBuffer(dxmin, dymin, dxmax, dymax) {
    this.min.x -= dxmin;
    this.min.y -= dymin || dxmin;
    this.max.x += dxmax || dxmin;
    this.max.y += dymax || dymin || dxmin;
    return this;
  },
  contains: function contains(point) {
    // ([x, y]) -> Boolean
    var min = this.min,
        max = this.max,
        x = point[0],
        y = point[1];
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
  },
  getCenter: function getCenter() {
    var min = this.min,
        max = this.max;
    return [(min.x + max.x) / 2, (min.y + max.y) / 2];
  },
  addOffset: function addOffset(offset) {
    this.min.x += offset[0];
    this.max.x += offset[0];
    this.min.y += offset[1];
    this.max.y += offset[1];
    return this;
  },
  intersects: function intersects(bounds) {
    // (Bounds) -> Boolean
    var min = this.min,
        max = this.max,
        min2 = bounds.min,
        max2 = bounds.max;
    return max2.x > min.x && min2.x < max.x && max2.y > min.y && min2.y < max.y;
  },
  intersectsWithDelta: function intersectsWithDelta(bounds, dx, dy) {
    // (Bounds, dx, dy) -> Boolean
    var min = this.min,
        max = this.max,
        x = dx || 0,
        y = dy || 0,
        min2 = bounds.min,
        max2 = bounds.max;
    return max2.x + x > min.x && min2.x - x < max.x && max2.y + y > min.y && min2.y - y < max.y;
  },
  isEqual: function isEqual(bounds) {
    // (Bounds) -> Boolean
    var min = this.min,
        max = this.max,
        min2 = bounds.min,
        max2 = bounds.max;
    return max2.x === max.x && min2.x === min.x && max2.y === max.y && min2.y === min.y;
  },
  isNodeIntersect: function isNodeIntersect(coords) {
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
}; // bounds: function(arr) {
// return new Bounds(arr);
// },

var Requests = {
  bounds: function bounds(arr) {
    return new Bounds(arr);
  },
  geoItemBounds: utils.geoItemBounds,
  chkSignal: chkSignal,
  COMPARS: COMPARS,
  setSyncParams: setSyncParams,
  getSyncParams: getSyncParams,
  parseURLParams: parseURLParams,
  // getMapTree,
  extend: utils.extend,
  getBitMap: utils.getBitMap,
  getFormBody: utils.getFormBody,
  getTileJson: utils.getTileJson,
  getJson: utils.getJson // addDataSource,
  // removeDataSource,
  // getReportsCount,
  // getLayerItems

};

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

var TILE_PREFIX = 'gmxAPI._vectorTileReceiver(';

var load = function load(pars) {
  pars = pars || {};

  if (!pars.signals) {
    pars.signals = {};
  }

  if (!pars.tilesPromise) {
    pars.tilesPromise = {};
  } // return new Promise((resolve) => {


  var tilesOrder = pars.tilesOrder,
      pb = pars.tiles,
      tilesPromise = {};

  var _loop = function _loop(i, len) {
    var arr = pb.slice(i, i + tilesOrder.length),
        tkey = arr.join('_'),
        tHash = tilesOrder.reduce(function (p, c, j) {
      p[c] = arr[j];
      return p;
    }, {});

    if (pars.tilesPromise[tkey]) {
      tilesPromise[tkey] = pars.tilesPromise[tkey];
    } else {
      // pars.tilesPromise[tkey] = Requests.getTileJson({
      tilesPromise[tkey] = Requests.getTileJson({
        url: '//' + pars.hostName + '/TileSender.ashx',
        options: Requests.chkSignal(tkey, pars.signals),
        paramsArr: [tHash, {
          r: 'j',
          ModeKey: 'tile',
          LayerName: pars.id
        }]
      }).then(function (json) {
        delete pars.signals[tkey];

        if (typeof json === 'string') {
          if (json.substr(0, TILE_PREFIX.length) === TILE_PREFIX) {
            json = json.replace(TILE_PREFIX, '');
            json = JSON.parse(json.substr(0, json.length - 1));
          }
        }

        json.bounds = Requests.bounds(json.bbox);
        return json;
      }).catch(function (err) {
        console.error(err);
      });
    }
  };

  for (var i = 0, len = pb.length; i < len; i += tilesOrder.length) {
    _loop(i);
  }

  Object.keys(pars.signals).forEach(function (k) {
    if (!tilesPromise[k]) {
      pars.signals[k].abort();
      delete pars.signals[k];
    }
  });
  pars.tilesPromise = tilesPromise; // return out;
  // Promise.all(arr).then((out) => {
  // resolve(out);
  // });
  // });
};

var TilesLoader = {
  load: load
};

// const HOST = 'maps.kosmosnimki.ru';
// let hosts = {},
// zoom = 3,
// bbox = null,
// dataManagersLinks = {},
// hostBusy = {},
// needReq = {}
// delay = 60000,
// intervalID = null,
// timeoutID = null;
// ph = {
// ctx: - 2d canvas контекст
// bounds: - bounds операции
// w: - canvas.width
// h: - canvas.height
// canvas: - canvas
// }
var _reqParse = function _reqParse(ph) {
  ph = ph || {};

  if (ph.canvas) {
    ph._ctx = ph._ctx || ph.canvas.getContext('2d');
    ph.w = ph.w || ph.canvas.width;
    ph.h = ph.h || ph.canvas.height;
  }

  return ph;
};

var utils$1 = {
  _clear: function _clear(ph) {
    ph = _reqParse(ph);

    if (ph.bounds) {
      var size = ph.bounds.getSize();

      ph._ctx.clearRect(ph.bounds.min.x, ph.bounds.min.y, size.x, size.y);
    } else {
      ph._ctx.save();

      ph._ctx.setTransform(1, 0, 0, 1, 0, 0);

      ph._ctx.clearRect(0, 0, ph.w, ph.h);

      ph._ctx.restore();
    }
  },
  _draw: function _draw(ph) {
    ph = _reqParse(ph); // var layer, bounds = this._redrawBounds;

    ph._ctx.save();

    if (ph.bounds) {
      var size = ph.bounds.getSize();

      ph._ctx.beginPath();

      ph._ctx.rect(ph.bounds.min.x, ph.bounds.min.y, size.x, size.y);

      ph._ctx.clip();
    }

    ph._drawing = true;

    for (var order = ph._drawFirst; order; order = order.next) {
      var layer = order.layer;

      if (!ph.bounds || layer._pxBounds && layer._pxBounds.intersects(ph.bounds)) ;
    }

    ph._drawing = false;

    ph._ctx.restore(); // Restore state before clipping.

  },
  _updatePoly: function _updatePoly(ph) {
    // _updatePoly: function (layer, closed) {
    ph = _reqParse(ph);

    if (!ph._drawing) {
      return;
    }

    var i,
        j,
        len2,
        // coords = ph.coords,
    parts = ph.itemData.pixels || ph._parts,
        len = parts.length,
        ctx = ph._ctx;

    if (!len) {
      return;
    }

    ctx.beginPath();

    for (i = 0; i < len; i++) {
      for (j = 0, len2 = parts[i].length; j < len2; j += 2) {
        //p = parts[i][j];
        ctx[j ? 'lineTo' : 'moveTo'](parts[i][j], parts[i][j + 1]);
      } // for (j = 0, len2 = parts[i].length; j < len2; j++) {
      // p = parts[i][j];
      // ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
      // }


      if (ph.closed) {
        ctx.closePath();
      }
    } // ctx.strokeText(coords.z + '.' + coords.x + '.' + coords.y, 150, 150);


    utils$1._fillStroke(ph); // TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature

  },
  _updatePolyMerc: function _updatePolyMerc(ph) {
    // _updatePoly: function (layer, closed) {
    ph = _reqParse(ph);

    if (!ph._drawing) {
      return;
    }

    var i,
        j,
        len2,
        p,
        // coords = ph.coords,
    parts = ph.itemData.pixels || ph._parts,
        mInPixel = ph.mInPixel,
        item = ph.itemData.item,
        coordinates = item[item.length - 1].coordinates,
        len = coordinates.length,
        ctx = ph._ctx;

    if (!len) {
      return;
    } // ctx.translate(ph.tpx * mInPixel, ph.tpy * mInPixel);


    ctx.translate(ph.tpx, ph.tpy);
    ctx.scale(mInPixel, mInPixel);
    ctx.beginPath();

    for (i = 0; i < len; i++) {
      for (j = 0, len2 = coordinates[i].length; j < len2; j++) {
        p = coordinates[i][j];
        ctx[j ? 'lineTo' : 'moveTo'](p[0], p[1]);
      } // for (j = 0, len2 = parts[i].length; j < len2; j++) {
      // p = parts[i][j];
      // ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
      // }


      if (ph.closed) {
        ctx.closePath();
      }
    } // ctx.strokeText(coords.z + '.' + coords.x + '.' + coords.y, 150, 150);


    utils$1._fillStroke(ph); // TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature

  },
  _updateCircle: function _updateCircle(ph) {
    // _updateCircle: function (layer) {
    ph = _reqParse(ph);

    if (!ph._drawing || !ph._point) {
      return;
    }

    var p = ph._point,
        ctx = ph._ctx,
        r = Math.max(Math.round(ph._radius), 1),
        s = (Math.max(Math.round(ph._radiusY), 1) || r) / r;

    if (s !== 1) {
      ctx.save();
      ctx.scale(1, s);
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

    if (s !== 1) {
      ctx.restore();
    }

    utils$1._fillStroke(ph);
  },
  _fillStroke: function _fillStroke(ph) {
    // _fillStroke: function (ctx, layer) {
    ph = _reqParse(ph);
    var options = ph.options,
        ctx = ph._ctx;

    if (options.fill) {
      ctx.globalAlpha = options.fillOpacity;
      ctx.fillStyle = options.fillColor || options.color;
      ctx.fill(options.fillRule || 'evenodd');
    }

    if (options.stroke && options.weight !== 0) {
      if (ctx.setLineDash) {
        ctx.setLineDash(options && options._dashArray || []);
      }

      ctx.globalAlpha = options.opacity;
      ctx.lineWidth = options.weight;
      ctx.strokeStyle = options.color;
      ctx.lineCap = options.lineCap;
      ctx.lineJoin = options.lineJoin;
      ctx.stroke();
    }
  }
};
var Renderer2d = {
  draw: utils$1._draw,
  updatePolyMerc: utils$1._updatePolyMerc,
  updatePoly: utils$1._updatePoly,
  updateCircle: utils$1._updateCircle,
  fillStroke: utils$1._fillStroke,
  clear: utils$1._clear
};

var HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496,
    W = WORLDWIDTHFULL / 2,
    WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx',
    GMXPROXY = '//maps.kosmosnimki.ru/ApiSave.ashx',
    MINZOOM = 1,
    MAXZOOM = 22,
    STYLEKEYS = {
  marker: {
    server: ['image', 'angle', 'scale', 'minScale', 'maxScale', 'size', 'circle', 'center', 'color'],
    client: ['iconUrl', 'iconAngle', 'iconScale', 'iconMinScale', 'iconMaxScale', 'iconSize', 'iconCircle', 'iconCenter', 'iconColor']
  },
  outline: {
    server: ['color', 'opacity', 'thickness', 'dashes'],
    client: ['color', 'opacity', 'weight', 'dashArray']
  },
  fill: {
    server: ['color', 'opacity', 'image', 'pattern', 'radialGradient', 'linearGradient'],
    client: ['fillColor', 'fillOpacity', 'fillIconUrl', 'fillPattern', 'fillRadialGradient', 'fillLinearGradient']
  },
  label: {
    server: ['text', 'field', 'template', 'color', 'haloColor', 'size', 'spacing', 'align'],
    client: ['labelText', 'labelField', 'labelTemplate', 'labelColor', 'labelHaloColor', 'labelFontSize', 'labelSpacing', 'labelAlign']
  }
};
var hosts = {},
    zoom = 3,
    bbox = null,
    // dataManagersLinks = {},
// hostBusy = {},
// needReq = {}
delay = 60000,
    intervalID = null,
    timeoutID = null;
var utils$2 = {
  getCoordsPixels: function getCoordsPixels(attr) {
    var coords = attr.coords,
        z = attr.z,
        tpx = attr.tpx,
        tpy = attr.tpy,
        hiddenLines = attr.hiddenLines || [],
        pixels = [],
        mInPixel = Math.pow(2, z + 8) / WORLDWIDTHFULL;
    /*
    ,
             hash = {
                 // gmx: gmx,
    	// topLeft: attr.topLeft,
                 tpx: tpx,
                 tpy: tpy,
                 coords: null,
                 hiddenLines: null
             };
    */

    for (var j = 0, len = coords.length; j < len; j++) {
      // var coords1 = coords[j],
      // hiddenLines1 = hiddenLines[j] || [],
      // pixels1 = [], hidden1 = [];
      coords[j].forEach(function (ringMerc) {
        var res = utils$2.getRingPixels({
          ringMerc: ringMerc,
          tpx: tpx,
          tpy: tpy,
          mInPixel: mInPixel,
          hiddenLines: hiddenLines
        });
        pixels.push(res.pixels); // var tt = res;
      });
      /*
               for (var j1 = 0, len1 = coords1.length; j1 < len1; j1++) {
                   hash.ringMerc = coords1[j1];
                   hash.hiddenLines = hiddenLines1[j1] || [];
                   var res = utils.getRingPixels(hash);
                   pixels1.push(res.coords);
                   hidden1.push(res.hidden);
                   if (res.hidden) {
                       hiddenFlag = true;
                   }
               }
               pixels.push(pixels1);
               hidden.push(hidden1);
      */
    }

    console.log('aaaaaaaaaa', pixels, tpx, tpy);
    return {
      coords: pixels,
      hidden:  null,
      z: z
    };
  },
  getRingPixels: function getRingPixels(_ref) {
    var ringMerc = _ref.ringMerc,
        tpx = _ref.tpx,
        tpy = _ref.tpy,
        mInPixel = _ref.mInPixel,
        hiddenLines = _ref.hiddenLines;
    console.log('getRingPixels', ringMerc, tpx, tpy);

    if (ringMerc.length === 0) {
      return null;
    }

    var cnt = 0,
        cntHide = 0,
        lastX = null,
        lastY = null,
        vectorSize = typeof ringMerc[0] === 'number' ? 2 : 1,
        pixels = [],
        hidden = [];

    for (var i = 0, len = ringMerc.length; i < len; i += vectorSize) {
      var lineIsOnEdge = false;

      if (hiddenLines && i === hiddenLines[cntHide]) {
        lineIsOnEdge = true;
        cntHide++;
      }

      var c = vectorSize === 1 ? ringMerc[i] : [ringMerc[i], ringMerc[i + 1]],
          x1 = Math.round((c[0] + W) * mInPixel),
          y1 = Math.round((W - c[1]) * mInPixel),
          x2 = Math.round(x1 - tpx),
          y2 = Math.round(y1 - tpy);

      if (lastX !== x2 || lastY !== y2) {
        lastX = x2;
        lastY = y2;

        if (lineIsOnEdge) {
          hidden.push(cnt);
        }

        pixels[cnt++] = x2;
        pixels[cnt++] = y2;
      }
    }

    return {
      pixels: pixels,
      hidden: hidden.length ? hidden : null
    };
  },
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

    utils$2.stop();
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
  parseFilter: function parseFilter(str) {
    var regex1 = /"(.+?)" in \((.+?)\)/g,
        regex2 = /"(.+?)"/g,
        regexMath = /(floor\()/g,
        body = str ? str.replace(/[[\]]/g, '"').replace(regex1, '[$2].includes(props[indexes[\'$1\']])').replace(regex2, 'props[indexes[\'$1\']]').replace(/=/g, '===').replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||').replace(regexMath, 'Math.$1') : true;
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
  // legend: false,
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
  decodeOldStyle: function decodeOldStyle(style) {
    // Style Scanex->leaflet
    var st,
        i,
        len,
        key,
        key1,
        styleOut = {}; // attrKeys = {},
    // type = '';

    for (key in STYLEKEYS) {
      var keys = STYLEKEYS[key];

      for (i = 0, len = keys.client.length; i < len; i++) {
        key1 = keys.client[i];

        if (key1 in style) {
          styleOut[key1] = style[key1];
        }
      }

      st = style[key];

      if (st && _typeof(st) === 'object') {
        for (i = 0, len = keys.server.length; i < len; i++) {
          key1 = keys.server[i];

          if (key1 in st) {
            var newKey = keys.client[i],
                zn = st[key1];

            if (typeof zn === 'string') ; else if (key1 === 'opacity') {
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
        styleOut.iconAnchor = [-dx, -dy]; // For leaflet type iconAnchor
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
  getTileBounds: function getTileBounds(coords) {
    var tileSize = WORLDWIDTHFULL / Math.pow(2, coords.z),
        minx = coords.x * tileSize - W,
        miny = W - coords.y * tileSize;
    return Requests.bounds([[minx, miny], [minx + tileSize, miny + tileSize]]);
  },
  // getTileNumFromLeaflet: function (tilePoint, zoom) {
  // if ('z' in tilePoint) {
  // zoom = tilePoint.z;
  // }
  // var pz = Math.pow(2, zoom),
  // tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0),
  // ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
  // return {
  // z: zoom,
  // x: tx % pz - pz / 2,
  // y: pz / 2 - 1 - ty % pz
  // };
  // },
  _getMaxStyleSize: function _getMaxStyleSize(zoom, styles) {
    // estimete style size for arbitrary object
    var maxSize = 0;

    for (var i = 0, len = styles.length; i < len; i++) {
      var style = styles[i];

      if (zoom > style.MaxZoom || zoom < style.MinZoom) {
        continue;
      }

      var RenderStyle = style.RenderStyle;

      if (this._needLoadIcons || !RenderStyle || !('maxSize' in RenderStyle)) {
        maxSize = 128;
        break;
      }

      var maxShift = 0;

      if ('iconAnchor' in RenderStyle && !RenderStyle.iconCenter) {
        maxShift = Math.max(Math.abs(RenderStyle.iconAnchor[0]), Math.abs(RenderStyle.iconAnchor[1]));
      }

      maxSize = Math.max(RenderStyle.maxSize + maxShift, maxSize);
    }

    return maxSize;
  },
  parseStyles: function parseStyles(prop) {
    var styles = prop.styles || []; // attr = prop.tileAttributeIndexes,
    // prop._maxStyleSize = 128;

    prop._maxStyleSize = 0;
    var out = styles.map(function (it) {
      return new Promise(function (resolve) {
        var data = utils$2.parseFilter(it.Filter || ''),
            renderStyle = it.RenderStyle,
            iconUrl = renderStyle.iconUrl || renderStyle.marker && renderStyle.marker.image;
        data.MinZoom = it.MinZoom || MINZOOM;
        data.MaxZoom = it.MaxZoom || MAXZOOM;

        if (renderStyle) {
          data.renderStyle = utils$2.decodeOldStyle(renderStyle);
        }

        if (iconUrl) {
          Requests.getBitMap(iconUrl).then(function (blob) {
            // .then(function(blob) {
            // return createImageBitmap(blob, {
            // premultiplyAlpha: 'none',
            // colorSpaceConversion: 'none'
            // });
            console.log('dsddd', blob);
            return createImageBitmap(blob, {
              premultiplyAlpha: 'none',
              colorSpaceConversion: 'none'
            }).then(function (imageBitmap) {
              data.imageBitmap = imageBitmap;

              if (prop._maxStyleSize < imageBitmap.width) {
                prop._maxStyleSize = imageBitmap.width;
              }

              if (prop._maxStyleSize < imageBitmap.height) {
                prop._maxStyleSize = imageBitmap.height;
              }

              resolve(data);
            }).catch(console.warn); // resolve(data);
          });
        } else {
          if (prop._maxStyleSize < data.renderStyle.weight) {
            prop._maxStyleSize = data.renderStyle.weight;
          }

          resolve(data);
        } // return data;

      });
    });
    return {
      stylesPromise: Promise.all(out)
    };
  },
  parseMetaProps: function parseMetaProps(prop) {
    var meta = prop.MetaProperties || {},
        ph = {};
    ph.dataSource = prop.dataSource || prop.LayerID || '';
    ['srs', // проекция слоя
    'dataSource', // изменить dataSource через MetaProperties
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
      if (k in meta) {
        ph[k] = meta[k].Value || '';
      }
    });

    if (ph.gmxProxy && ph.gmxProxy.toLowerCase() === 'true') {
      // проверка прокачивалки
      ph.gmxProxy = GMXPROXY;
    }

    if ('parentLayer' in meta) {
      // изменить dataSource через MetaProperties
      ph.dataSource = meta.parentLayer.Value;
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
  },
  getStyleNum: function getStyleNum(itemArr, layerAttr, zoom) {
    var indexes = layerAttr.tileAttributeIndexes;

    if (layerAttr.stylesParsed) {
      for (var i = 0, len = layerAttr.stylesParsed.length; i < len; i++) {
        var st = layerAttr.stylesParsed[i];

        if (zoom && (zoom < st.MinZoom || zoom > st.MaxZoom)) {
          continue;
        }

        if (st.filterFun(itemArr, indexes)) {
          return i;
        }
      }
    } else {
      return 0;
    }

    return -1;
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
      // generalizedTiles: false,
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
  var _loop = function _loop(host) {
    chkHost(host).then(function (json) {
      if (json.error) {
        console.warn('chkVersion:', json.error);
      } else {
        var hostLayers = hosts[host],
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

              if (!pt.tileAttributeIndexes) {
                Requests.extend(pt, utils$2.getTileAttributes(props));
              }
            }

            pt.hostName = host;
            pt.tiles = it.tiles;
            pt.tilesOrder = it.tilesOrder; // pt.tilesPromise = 

            TilesLoader.load(pt);
            Promise.all(Object.values(pt.tilesPromise)).then(function (res) {
              //self.postMessage({res: res, host: host, dmID: it.name, cmd: 'TilesData'});
              console.log('tilesPromise ___:', hosts, res);

              _waitCheckObservers();
            }); // pt.tilesPromise.then(res => {
            // console.log('tilesPromise ___:', hosts, res);
            // });
            // console.log('chkVersion ___:', pt);
          }); // resolve(res.Result.Key !== 'null' ? '' : res.Result.Key);
          // } else {
          // reject(json);
          // console.log('chkVersion key:', host, hosts);
        }
      }
    });
  };

  for (var host in hosts) {
    _loop(host);
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
      utils$2.start();
    }

    utils$2.now();
  } else {
    console.warn('Warning: Specify layer `id` and `hostName`', pars);
  }

  if (pars.vid) {
    var parseLayers = hosts[pars.vHostName || HOST].parseLayers;

    if (parseLayers) {
      var linkAttr = parseLayers.layersByID[pars.vid];
      Requests.extend(linkAttr, utils$2.parseStyles(linkAttr.properties));
      linkAttr.stylesPromise.then(function (res) {
        linkAttr.styles = res;
      });
    }
  } // console.log('addSource:', pars);


  return;
};

var removeSource = function removeSource(pars) {
  pars = pars || {};
  var id = pars.id;

  if (id) {
    var hostName = pars.hostName || HOST;

    if (hosts[hostName]) {
      var pt = hosts[hostName].ids[id];
      console.log('signals:', pt.signals, pt);

      if (pt.signals) {
        Object.values(pt.signals).forEach(function (it) {
          it.abort();
        });
      }

      delete hosts[hostName].ids[id];

      if (Object.keys(hosts[hostName].ids).length === 0) {
        delete hosts[hostName];
      }

      if (Object.keys(hosts).length === 0) {
        utils$2.stop();
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

  utils$2.now();
  return;
};

var _checkObserversTimer = null;

var _waitCheckObservers = function _waitCheckObservers() {
  if (_checkObserversTimer) {
    clearTimeout(_checkObserversTimer);
  }

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


var getStyleNum = function getStyleNum(arr, styles, indexes, z) {
  // let out = -1;
  return 0;
};

var _parseItem = function _parseItem(_ref2) {
  var item = _ref2.item,
      st = _ref2.st,
      bounds = _ref2.bounds,
      hiddenLines = _ref2.hiddenLines,
      pars = _ref2.pars;
  // let geo = item[item.length - 1],
  // type = geo.type,
  // z = pars.z;
  return {};
};

var _checkVectorTiles = function _checkVectorTiles(_ref3) {
  var arrTiles = _ref3.arrTiles,
      observers = _ref3.observers,
      styles = _ref3.styles,
      indexes = _ref3.indexes,
      sort = _ref3.sort;

  var _loop2 = function _loop2(i, len) {
    var tile = arrTiles[i],
        pixels = tile.pixels,
        styleNums = tile.styleNums,
        itemsbounds = tile.itemsbounds,
        hiddenLines = tile.hiddenLines;

    if (!styleNums) {
      styleNums = tile.styleNums = [];
    }

    if (!itemsbounds) {
      itemsbounds = tile.itemsbounds = [];
    }

    if (!hiddenLines) {
      hiddenLines = tile.hiddenLines = [];
    }

    if (!pixels) {
      pixels = tile.pixels = [];
    }

    var _loop3 = function _loop3(zKey) {
      var observer = observers[zKey]; // let flag = observer.bounds.intersects(tile.bounds);
      // if (!observer.bounds.intersects(tile.bounds)) {
      // continue;
      // }

      if (!observer.tcnt) {
        observer.tcnt = 0;
      }

      observer.tcnt++;
      observer.items = [];
      tile.values.forEach(function (it, n) {
        // let parsed = 
        _parseItem({
          hiddenLines: hiddenLines[n],
          bounds: itemsbounds[n],
          st: styleNums[n],
          pars: observer.pars,
          item: it
        });

        var geo = it[it.length - 1],
            st = styleNums[n],
            bounds = itemsbounds[n];

        if (st === undefined) {
          st = getStyleNum(it, styles, indexes, observer.pars.z);
          tile.styleNums[n] = styleNums[n] = st;
        }

        if (!bounds) {
          bounds = Requests.geoItemBounds(geo);
          tile.itemsbounds[n] = itemsbounds[n] = bounds;
        }

        var pt = {
          st: st,
          itemData: {
            bounds: bounds,
            item: it
          }
        }; // TODO: если НЕТ сортировки объектов то тут отрисовка иначе после сортировки

        if (sort) {
          observer.items.push(pt);
        } else {
          pt.observer = observer;
          drawItem(pt);
        }
      });
    };

    for (var zKey in observers) {
      _loop3(zKey);
    }
  };

  for (var i = 0, len = arrTiles.length; i < len; i++) {
    _loop2(i);
  }

  console.log('checkObservers _____1__________:', hosts);
};

var checkObservers = function checkObservers() {
  console.log('checkObservers _______________:', hosts);
  Object.keys(hosts).forEach(function (host) {
    Object.keys(hosts[host].ids).forEach(function (layerID) {
      var tData = hosts[host].ids[layerID],
          layerData = hosts[host].parseLayers.layersByID[layerID],
          styles = layerData.styles || [],
          // oKeys = Object.keys(tData.observers),
      observers = tData.observers || {},
          indexes = tData.tileAttributeIndexes,
          tilesPromise = tData.tilesPromise;

      if (tilesPromise) {
        layerData.stylesPromise.then(function (arrStyle) {
          var _maxStyleSize = layerData.properties._maxStyleSize || 128;

          Object.keys(observers).forEach(function (key) {
            var observer = observers[key];

            if (!observer.bounds) {
              var coords = observer.pars.coords,
                  z = observer.pars.z;
              _maxStyleSize = utils$2._getMaxStyleSize(z, styles); // var mercSize = 2 * _maxStyleSize * WORLDWIDTHFULL / Math.pow(2, 8 + z); //TODO: check formula

              observer.bounds = utils$2.getTileBounds(coords);
            }
          });
          Promise.all(Object.values(tilesPromise)).then(function (arrTiles) {
            _checkVectorTiles({
              sort: layerData.sorting,
              arrTiles: arrTiles,
              observers: observers,
              styles: styles,
              indexes: indexes
            });

            for (var zKey in observers) {
              var observer = observers[zKey],
                  pars = observer.pars;
              pars.bitmap = observer.canvas.transferToImageBitmap();
              observer.resolver(pars); // observer.resolver({
              // bitmap: observer.canvas.transferToImageBitmap()
              // });
            }
            /*
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
            */


            console.log('checkObservers _____1__________:', hosts, arrStyle);
          });
        });
      }
    });
  });
};

var addObserver = function addObserver(pars) {
  console.log('addObserver_______________:', pars, hosts);
  return new Promise(function (resolve) {
    var layerID = pars.layerID,
        zKey = pars.zKey,
        host = hosts[pars.hostName || HOST],
        out = {};

    if (host && host.parseLayers && host.parseLayers.layersByID[layerID]) {
      // let stData = host.parseLayers.layersByID[layerID],
      var tData = host.ids[layerID];

      if (!tData.observers) {
        tData.observers = {};
      } // let bounds = Requests.bounds();


      if (pars.bbox) {
        bounds = bounds.extendBounds(pars.bbox);
      }

      tData.observers[zKey] = {
        // bounds: bounds,
        pars: pars,
        resolver: resolve
      }; // console.log('addObserver ____1_______:', stData, tData);
      // start Recheck Observers on next frame

      _waitCheckObservers(); // out.data = layerID;
      // resolve(out);

    } else {
      out.error = 'Нет слоя: ' + layerID;
      resolve(out);
    }
  });
};

var removeObserver = function removeObserver(pars) {
  var host = hosts[pars.hostName];

  if (host && host.ids[pars.layerID]) {
    var observers = host.ids[pars.layerID].observers;

    if (observers) {
      observers[pars.zKey].resolver([]);
      delete observers[pars.zKey];
    }
  }

  console.log('removeObserver _______________:', pars, hosts);
};

var setDateInterval = function setDateInterval(pars) {
  pars = pars || {};
  var host = hosts[pars.hostName];

  if (host && host.ids[pars.id]) {
    host.ids[pars.id].dateBegin = pars.dateBegin;
    host.ids[pars.id].dateEnd = pars.dateEnd;
  }

  utils$2.now();
  console.log('setDateInterval:', pars, hosts);
};

var _iterateNodeChilds = function _iterateNodeChilds(node, level, out) {
  level = level || 0;
  out = out || {
    layers: [],
    layersByID: {}
  };

  if (node) {
    var type = node.type,
        content = node.content,
        props = content.properties;

    if (type === 'layer') {
      var ph = {
        properties: props,
        level: level
      }; // let ph = utils.parseLayerProps(props);
      // ph.level = level;

      if (content.geometry) {
        ph.geometry = content.geometry;
      }

      out.layers.push(ph);
      out.layersByID[props.name] = ph;
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

var getMapTree = function getMapTree(pars) {
  pars = pars || {};
  var hostName = pars.hostName || HOST,
      host = hosts[hostName];
  return new Promise(function (resolve) {
    if (host && host.layerTree) {
      resolve(host.layerTree);
    } else {
      var apiKeyPromise = !host || !host.apiKeyPromise ? Requests.getJson({
        url: '//' + hostName + '/ApiKey.ashx',
        paramsArr: [{
          Key: pars.apiKey
        }]
      }) : host.apiKeyPromise; // if (!host || !host.apiKeyPromise) {
      // host.apiKeyPromise = Requests.getJson({
      // url: '//' + hostName + '/ApiKey.ashx',
      // paramsArr: [{
      // Key: pars.apiKey
      // }]
      // });
      // }

      apiKeyPromise.then(function (json) {
        // console.log('/ApiKey.ashx', json);
        var res = json.res;

        if (res.Status === 'ok' && res.Result) {
          return res.Result.Key;
        }

        return null;
      }).then(function (apiKey) {
        Requests.getJson({
          url: '//' + hostName + '/Map/GetMapFolder',
          // options: {},
          params: {
            apiKey: apiKey,
            srs: 3857,
            skipTiles: 'All',
            mapId: pars.mapID,
            folderId: 'root',
            visibleItemOnly: false
          }
        }).then(function (json) {
          if (!hosts[hostName]) {
            hosts[hostName] = {
              ids: {},
              signals: {}
            };
          }

          console.log('getMapTree:', hosts, json);
          resolve(json);
          hosts[hostName].layerTree = json.res.Result;
          hosts[hostName].parseLayers = parseTree(json.res);

          if (apiKey) {
            hosts[hostName].apiKeyPromise = apiKeyPromise;
            hosts[hostName].apiKey = apiKey;
          }
        });
      });
    }
  });
};

var drawTest = function drawTest(pars) {
  var canvas = new OffscreenCanvas(256, 256),
      // const canvas = message.canvas,
  w = canvas.width,
      h = canvas.height,
      ctx = canvas.getContext('2d'); // gl = canvas.getContext('webgl');
  // ctx.fillStyle = 'red';
  // ctx.lineWidth = 5;
  // ctx.rect(5, 5, w - 5, h - 5);
  // ctx.fill();

  Renderer2d.updatePoly({
    coords: pars.coords,
    _drawing: true,
    closed: true,
    _ctx: ctx,
    canvas: canvas,
    w: w,
    h: h,
    options: pars.options || {
      fillRule: 'evenodd',
      _dashArray: null,
      lineCap: "butt",
      lineJoin: "miter",
      color: "green",
      fillColor: "blue",
      interactive: true,
      smoothFactor: 1,
      weight: 10,
      opacity: 1,
      fillOpacity: 1,
      stroke: true,
      fill: false
    },
    _parts: pars._parts || [[{
      "x": 0,
      "y": 0
    }, {
      "x": 255,
      "y": 255
    }, {
      "x": 255,
      "y": 0
    }, {
      "x": 0,
      "y": 255
    }]] // _parts: message._parts || [[{"x":54,"y":40},{"x":95,"y":40},{"x":95,"y":88}]]

  }); // delete message. ;
  // message.out = {done: true};
  // let bitmap = canvas.transferToImageBitmap();

  return {
    bitmap: canvas.transferToImageBitmap()
  };
};

var drawTile = function drawTile(pars) {
  pars = pars || {};
  var hostName = pars.hostName || HOST,
      layerID = pars.layerID,
      host = hosts[hostName],
      parsedLayer = host.parseLayers.layersByID[layerID],
      ids = host.ids[layerID]; // console.log('drawTile:', pars);

  return new Promise(function (resolve) {
    parsedLayer.stylesPromise.then(function (st) {
      Promise.all(Object.values(ids.tilesPromise)).then(function (res) {
        console.log('drawTile tilesPromise ___:', st, res);
        resolve(Requests.extend(drawTest(pars), pars));
      });
    }); // if (host && host.layerTree) {
    // resolve(host.layerTree);
    // } else {
    // Requests.getJson({
    // url: '//' + hostName + '/Map/GetMapFolder',
    // options: {},
    // params: {
    // srs: 3857, 
    // skipTiles: 'All',
    // mapId: pars.mapID,
    // folderId: 'root',
    // visibleItemOnly: false
    // }
    // }).then(json => {
    // if (!hosts[hostName]) { hosts[hostName] = {ids: {}, signals: {}}; }
    // console.log('getMapTree:', hosts, json);
    // resolve(json);
    // hosts[hostName].layerTree = json.res.Result;
    // hosts[hostName].parseLayers = parseTree(json.res);
    // })
    // }
  });
};

var _parseGeo = function _parseGeo(pars) {
  var observer = pars.observer,
      tn = observer.pars.coords,
      itemData = pars.itemData,
      item = itemData.item,
      geo = item[item.length - 1],
      geoType = geo.type,
      out;

  if (geoType === 'POLYGON' || geoType === 'MULTIPOLYGON') {
    var coords = geo.coordinates;

    if (geoType === 'POLYGON') {
      coords = [coords];
    }

    out = utils$2.getCoordsPixels({
      coords: coords,
      z: tn.z,
      tpx: pars.tpx,
      tpy: pars.tpy
    });
  }

  return out;
};

var drawItem = function drawItem(pars) {
  var observer = pars.observer,
      ctx = observer.ctx,
      itemData = pars.itemData,
      item = itemData.item,
      last = item.length - 1,
      geo = item[last],
      type = geo.type,
      coords = observer.pars.coords,
      tz = Math.pow(2, coords.z),
      // tpx = 256 * coords.x,
  // tpy = 256 * coords.y,
  tpx = 256 * Math.abs(coords.x % tz),
      tpy = 256 * Math.abs(coords.y % tz),
      // tpy = 256 * (1 + coords.y),
  pt = {
    _merc: true,
    // TODO: рисование напрямую из Меркатора
    mInPixel: Math.pow(2, coords.z + 8) / WORLDWIDTHFULL,
    _drawing: true,
    closed: true,
    _ctx: ctx,
    tpx: tpx,
    tpy: tpy,
    itemData: itemData,
    options: pars.options || {
      fillRule: 'evenodd',
      _dashArray: null,
      lineCap: "butt",
      lineJoin: "miter",
      color: "green",
      fillColor: "blue",
      interactive: true,
      smoothFactor: 1,
      weight: 10,
      opacity: 1,
      fillOpacity: 1,
      stroke: true,
      fill: false
    },
    _parts: itemData.pixels || [[{
      "x": 0,
      "y": 0
    }, {
      "x": 255,
      "y": 255
    }, {
      "x": 255,
      "y": 0
    }, {
      "x": 0,
      "y": 255
    }]]
  };
  /*
  // TODO: рисование напрямую из Меркатора
  	tpx - сдвиг px по X
  	tpy - сдвиг px по Y
  */
  // if (coords.x === -1 && coords.y === 0 && coords.z === 1) {

  console.log('ddd', coords, pt); // }

  if (!itemData.pixels) {
    pars.tpx = tpx;
    pars.tpy = tpy;

    var tt = _parseGeo(pars);

    itemData.pixels = tt.coords;
    itemData.hidden = tt.hidden;
  }

  if (!ctx) {
    var canvas = new OffscreenCanvas(256, 256);
    canvas.width = canvas.height = 256;
    observer.canvas = canvas; // const canvas = message.canvas,
    // w = canvas.width,
    // h = canvas.height,

    pt._ctx = observer.ctx = canvas.getContext('2d');
  }

  pt._ctx.fillText(coords.x + ':' + coords.y + ':' + coords.z, 128, 128);

  Renderer2d.updatePoly(pt); // delete message. ;
  // message.out = {done: true};
  // let bitmap = canvas.transferToImageBitmap();
  // return {
  // bitmap: canvas.transferToImageBitmap()
  // };
};

var getTiles = function getTiles(message) {
  var hostName = message.hostName,
      layerID = message.layerID,
      queue = message.queue,
      z = message.z,
      hostLayers = hosts[hostName];

  if (hostLayers && hostLayers.ids && hostLayers.ids[layerID]) {
    var observers = hostLayers.ids[layerID].observers;

    for (var key in observers) {
      if (observers[key].pars.z !== z) {
        observers[key].resolver(null);
        delete observers[key];
      }
    }
  } // console.log('vvvvvvvvvv ___res____ ', message);


  return Promise.all(queue.map(function (coords) {
    return addObserver(Requests.extend({
      coords: coords,
      zKey: coords.x + ':' + coords.y + ':' + coords.z
    }, message));
  }));
};

var DataVersion = {
  getTiles: getTiles,
  drawTile: drawTile,
  addObserver: addObserver,
  removeObserver: removeObserver,
  getMapTree: getMapTree,
  setDateInterval: setDateInterval,
  moveend: moveend,
  removeSource: removeSource,
  addSource: addSource
};

var _self$1 = self;

(_self$1.on || _self$1.addEventListener).call(_self$1, 'message', function (e) {
  var message = e.data || e; // console.log('in message ', e);

  switch (message.cmd) {
    case 'getTiles':
      console.log('getTiles ', message);
      /*
      			Promise.all(message.queue.map(coords => 
      				DataVersion.addObserver(Requests.extend({
      					coords: coords,
      					zKey: coords.x + ':' + coords.y + ':' + coords.z
      				}, message))
      				// .then((json) => {
      					//message.out = json;
      			// console.log('vvvvvvvvvv ___res____ ', message);
      					//_self.postMessage(message);
      					// return json;
      				// })
      				//DataVersion.drawTile(Requests.extend({coords: coords}, message))
      				
      			))
      			*/

      DataVersion.getTiles(message).then(function (arr) {
        console.log('getTiles111 ', arr);
        message.out = arr;

        _self$1.postMessage(message);
      });
      break;

    case 'addCanvasTile':
      var canvas = new OffscreenCanvas(256, 256),
          // const canvas = message.canvas,
      w = canvas.width,
          h = canvas.height,
          ctx = canvas.getContext('2d'); // gl = canvas.getContext('webgl');
      // ctx.fillStyle = 'red';
      // ctx.lineWidth = 5;
      // ctx.rect(5, 5, w - 5, h - 5);
      // ctx.fill();

      Renderer2d.updatePoly({
        coords: message.coords,
        _drawing: true,
        closed: true,
        _ctx: ctx,
        canvas: canvas,
        w: w,
        h: h,
        options: message.options || {
          fillRule: 'evenodd',
          _dashArray: null,
          lineCap: "butt",
          lineJoin: "miter",
          color: "green",
          fillColor: "blue",
          interactive: true,
          smoothFactor: 1,
          weight: 10,
          opacity: 1,
          fillOpacity: 1,
          stroke: true,
          fill: false
        },
        _parts: message._parts || [[{
          "x": 0,
          "y": 0
        }, {
          "x": 255,
          "y": 255
        }, {
          "x": 255,
          "y": 0
        }, {
          "x": 0,
          "y": 255
        }]] // _parts: message._parts || [[{"x":54,"y":40},{"x":95,"y":40},{"x":95,"y":88}]]

      }); // delete message. ;

      message.out = {
        done: true
      };
      message.bitmap = canvas.transferToImageBitmap();

      _self$1.postMessage(message, [message.bitmap]);

      break;

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
      DataVersion.getMapTree({
        mapID: message.mapID,
        apiKey: message.apiKey,
        hostName: message.hostName,
        search: message.search
      }).then(function (json) {
        // Requests.getMapTree({mapID: message.mapID, hostName: message.hostName, search: message.search}).then((json) => {
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

    case 'addObserver':
      DataVersion.addObserver(message).then(function (json) {
        message.out = json;
        console.log('vvvvvvvvvv ___res____ ', message);

        _self$1.postMessage(message);
      });
      break;

    case 'removeObserver':
      DataVersion.removeObserver(message);
      break;

    case 'setDateInterval':
      DataVersion.setDateInterval(message);
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
