var gmxWorker = (function (exports, L) {
    'use strict';

    L = L && L.hasOwnProperty('default') ? L['default'] : L;

    const kIsNodeJS = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]'; // eslint-disable-line
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
    var WorkerFactory = createURLWorkerFactory('/api5/' + 'geomixer/external/gmx.worker/dist/web-worker-0.js');
    /* eslint-enable */

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

    var dataWorker = new WorkerFactory();
    var urlPars = Requests.parseURLParams();
    console.log('urlPars', urlPars);
    var reqNeedResolve = {};

    dataWorker.onmessage = function (res) {
      var data = res.data,
          code = data.code,
          pt = reqNeedResolve[code],
          json = data.out; // console.log('onmessage _____________', code, res);

      if (pt && pt.resolve) {
        if (data.bitmap) {
          json.bitmap = data.bitmap;
        } // console.log('resolve _____________', json);


        pt.resolve(json); // console.log('resolve 1 _____________', json);

        delete reqNeedResolve[code];
      }
    };

    var WORLDWIDTHFULL = 40075016.685578496,
        W = WORLDWIDTHFULL / 2,
        // WORLDBBOX = JSON.stringify([[-W, -W, W, W]]);
    WORLDBBOX = [[-W, -W, W, W]]; //dataWorker.postMessage('Hello World!');

    var Utils = {
      getStyleAtlas: function getStyleAtlas(styles) {
        var res = styles.map(function (st) {
          var rst = st.RenderStyle,
              cancelProm = new Promise(function (resolve) {
            return resolve(null);
          });

          if (!rst || !rst.iconUrl) {
            return cancelProm;
          } else {
            return fetch(rst.iconUrl, {
              mode: 'cors',
              type: 'bitmap'
            }).then(function (req) {
              return req.blob();
            }) // .then(blob => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', }))
            .catch(function (err) {
              console.warn(err);
              return cancelProm;
            });
          }
        });
        return Promise.all(res).then(function (arr) {
          console.log('getStyleAtlas', arr);
        }); // async function loadNextImage() {
        // const url = `${imageUrls[imgNdx]}?cachebust=${performance.now()}`;
        // imgNdx = (imgNdx + 1) % imageUrls.length;
        // const res = await fetch(url, {mode: 'cors'});
        // const blob = await res.blob();
        // const bitmap = await createImageBitmap(blob, {
        // premultiplyAlpha: 'none',
        // colorSpaceConversion: 'none',
        // });
        // if (update) {
        // gl.bindTexture(gl.TEXTURE_2D, tex);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        // imgAspect = bitmap.width / bitmap.height;
        // }
        // setTimeout(loadNextImage, 1000);
        // }
      },
      getBboxes: function getBboxes(map) {
        if (map.options.allWorld) {
          return WORLDBBOX;
        }

        var bbox = map.getBounds(),
            ne = bbox.getNorthEast(),
            sw = bbox.getSouthWest();

        if (ne.lng - sw.lng > 180) {
          return WORLDBBOX;
        }

        var zoom = map.getZoom(),
            ts = L.gmxUtil.tileSizes[zoom],
            pb = {
          x: ts,
          y: ts
        },
            mbbox = L.bounds(L.CRS.EPSG3857.project(sw)._subtract(pb), L.CRS.EPSG3857.project(ne)._add(pb)),
            minY = mbbox.min.y,
            maxY = mbbox.max.y,
            minX = mbbox.min.x,
            maxX = mbbox.max.x,
            minX1 = null,
            maxX1 = null,
            ww = WORLDWIDTHFULL,
            size = mbbox.getSize(),
            out = [];

        if (size.x > ww) {
          return WORLDBBOX;
        }

        if (maxX > W || minX < -W) {
          var hs = size.x / 2,
              center = (maxX + minX) / 2 % ww;
          center = center + (center > W ? -ww : center < -W ? ww : 0);
          minX = center - hs;
          maxX = center + hs;

          if (minX < -W) {
            minX1 = minX + ww;
            maxX1 = W;
            minX = -W;
          } else if (maxX > W) {
            minX1 = -W;
            maxX1 = maxX - ww;
            maxX = W;
          }
        }

        out.push([minX, minY, maxX, maxY]);

        if (minX1) {
          out.push([minX1, minY, maxX1, maxY]);
        }

        return out; // return JSON.stringify(out);
      },
      setSyncParams: function setSyncParams(syncParams) {
        syncParams = syncParams || {}; // dataWorker.onmessage = (res) => {
        // if (res.data.cmd === 'setSyncParams') {
        // console.log('onmessage setSyncParams ', res);
        // }
        // };

        dataWorker.postMessage({
          cmd: 'setSyncParams',
          syncParams: syncParams
        });
      },
      getSyncParams: function getSyncParams(stringFlag) {
        return new Promise(function () {
          // dataWorker.onmessage = (res) => {
          // if (res.data.cmd === 'getSyncParams') {
          // resolve(res.data.syncParams);
          // console.log('onmessage getSyncParams ', res);
          // }
          // };
          dataWorker.postMessage({
            cmd: 'getSyncParams',
            stringFlag: stringFlag
          });
        });
      },
      setDateInterval: function setDateInterval(dateInterval, id, hostName) {
        console.log('setDateInterval', dateInterval, id, hostName);
        return new Promise(function () {
          // dataWorker.onmessage = (res) => {
          // if (res.data.cmd === 'setDateInterval') { resolve(res.data); }
          // };
          dataWorker.postMessage({
            cmd: 'setDateInterval',
            id: id,
            hostName: hostName || 'maps.kosmosnimki.ru',
            dateBegin: Math.floor(dateInterval.beginDate.getTime() / 1000),
            dateEnd: Math.floor(dateInterval.endDate.getTime() / 1000)
          });
        });
      },
      getTiles: function getTiles(opt) {
        var code = 'getTiles_' + JSON.stringify(opt.coords || {});
        return new Promise(function (resolve) {
          reqNeedResolve[code] = {
            resolve: resolve
          };
          opt.code = code;
          opt.cmd = 'getTiles';
          dataWorker.postMessage(opt);
        });
      },
      addCanvasTile: function addCanvasTile(opt) {
        var code = 'addCanvasTile_' + JSON.stringify(opt.coords || {});
        return new Promise(function (resolve) {
          reqNeedResolve[code] = {
            resolve: resolve
          }; // dataWorker.onmessage = (res) => {
          // console.log('addObserver___res____ ', res);
          // if (res.data.cmd === 'addObserver') { resolve(res.data); }
          // };

          opt.code = code;
          opt.cmd = 'addCanvasTile';
          dataWorker.postMessage(opt); // dataWorker.postMessage(opt, [opt.canvas]);
        });
      },
      addObserver: function addObserver(opt) {
        return new Promise(function () {
          // dataWorker.onmessage = (res) => {
          // console.log('addObserver___res____ ', res);
          // if (res.data.cmd === 'addObserver') { resolve(res.data); }
          // };
          opt.cmd = 'addObserver';
          dataWorker.postMessage(opt);
        });
      },
      removeObserver: function removeObserver(opt) {
        opt.cmd = 'removeObserver';
        dataWorker.postMessage(opt);
      },
      getMap: function getMap(opt) {
        opt = opt || {};
        return new Promise(function (resolve) {
          var mapID = urlPars.main.length ? urlPars.main[0] : opt.mapID,
              code = 'getMap_' + mapID; // let mapID = urlPars.main.length ? urlPars.main[0] : opt.mapID, hostName: opt.hostName, search: location.search});
          // dataWorker.onmessage = (res) => {
          // let data = res.data,
          // cmd = data.cmd,
          // json = data.out;
          // if (cmd === 'getMap') {
          // resolve(json);
          // }
          // console.log('getMap _____________', json);
          // };

          reqNeedResolve[code] = {
            resolve: resolve
          };
          dataWorker.postMessage({
            code: code,
            cmd: 'getMap',
            apiKey: opt.apiKey,
            mapID: mapID
          });
        });
      }
    };
    L.Map.addInitHook(function () {
      var map = this;
      map.on('layeradd', function (ev) {
        if (ev.layer._gmx) {
          var layer = ev.layer,
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
            vid: _gmx.layerID,
            vHostName: _gmx.hostName,
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

          var arr = layer.getStyles();
          console.log('layeradd styles', arr, Utils.getStyleAtlas(arr));
          return new Promise(function (resolve) {
            if (_gmx) {
              // dataWorker.onmessage = (res) => {
              // let data = res.data,
              // cmd = data.cmd,
              // json = data.out;
              // if (cmd === 'addDataSource') {
              // resolve(json);
              // }
              // };
              dataWorker.postMessage(pars);
              dm.on('onDateInterval', function (ev) {
                Utils.setDateInterval({
                  beginDate: ev.beginDate,
                  endDate: ev.endDate
                }, id, hostName);
              });
            } else {
              resolve({
                error: 'Not Geomixer layer'
              });
            }
          });
        }
      }).on('moveend', function () {
        dataWorker.postMessage({
          cmd: 'moveend',
          bbox: Utils.getBboxes(map),
          zoom: map.getZoom()
        });
      }).on('layerremove', function (ev) {
        // console.log('layerremove', ev);
        var it = ev.layer,
            _gmx = it._gmx;
        return new Promise(function (resolve) {
          if (_gmx) {
            // dataWorker.onmessage = (res) => {
            // let data = res.data,
            // cmd = data.cmd,
            // json = data.out;
            // if (cmd === 'removeDataSource') {
            // resolve(json);
            // }
            // };
            dataWorker.postMessage({
              cmd: 'removeDataSource',
              id: _gmx.layerID,
              hostName: _gmx.hostName
            });
          } else {
            resolve({
              error: 'Not Geomixer layer'
            });
          }
        });
      }); // Utils.getMap({mapID: 'G1XRF'})
      // .then((res) => {
      // console.log('sss', res);
      // });

      /*
      	var htmlCanvas = L.DomUtil.create("canvas", 'htmlCanvas');
      	htmlCanvas.width = htmlCanvas.height = 256;
      	document.body.appendChild(htmlCanvas);
      	
      	var offscreen = htmlCanvas.transferControlToOffscreen();
      
      	// var worker = new Worker("offscreencanvas.js"); 
      	L.dataWorker.postMessage({
      		cmd: 'testCanvas',
      		canvas: offscreen,
      		_parts: [[{"x":54,"y":4},{"x":95,"y":40},{"x":95,"y":88}]],
      		options: {
      			fillRule: 'evenodd',
      			_dashArray: null,
      			lineCap: "butt",
      			lineJoin: "round",
      			color: "green",
      			fillColor: "blue",
      			interactive: true,
      			smoothFactor: 1,
      			weight: 10,
      			opacity: 1,
      			fillOpacity: 1,
      			stroke: true,
      			fill: false
      		}
      	}, [offscreen]);
      */
    });
    L.gmxWorker = Utils;
    L.dataWorker = dataWorker;

    exports.Utils = Utils;
    exports.dataWorker = dataWorker;

    return exports;

}({}, L));
//# sourceMappingURL=gmx-worker.js.map
