var gmxWorker = (function (exports) {
    'use strict';

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
    var WorkerFactory = createURLWorkerFactory('geomixer/external/gmx.worker/dist/web-worker-0.js');
    /* eslint-enable */

    var _self = self || window,
        serverBase = _self.serverBase || '//maps.kosmosnimki.ru/',
        serverProxy = serverBase + 'Plugins/ForestReport/proxy';

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
      getDataSource: function getDataSource(id, hostName) {
        // var maps = gmx._maps[hostName];
        // for (var mID in maps) {
        // var ds = maps[mID].dataSources[id];
        // if (ds) { return ds; }
        // }
        return null;
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
        var par = utils.extend({}, queue.params, syncParams),
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
    */

    var getMapTree = function getMapTree(params) {
      params = params || {};
      return utils.getJson({
        url: serverBase + 'Map/GetMapFolder',
        // options: {},
        params: {
          srs: 3857,
          skipTiles: 'All',
          mapId: params.mapId || 'C8612B3A77D84F3F87953BEF17026A5F',
          folderId: 'root',
          visibleItemOnly: false
        }
      }).then(function (json) {
        return parseTree(json.res);
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
          var ph = {
            level: level,
            properties: props
          };

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

    var getReq = function getReq(url) {
      return fetch(url, {
        method: 'get',
        mode: 'cors',
        credentials: 'include' // headers: {'Accept': 'application/json'},
        // body: JSON.stringify(params)	// TODO: сервер почему то не хочет работать так https://googlechrome.github.io/samples/fetch-api/fetch-post.html

      }).then(function (res) {
        return res.json();
      }).catch(function (err) {
        return console.warn(err);
      });
    };

    var getLayerItems = function getLayerItems(params) {
      params = params || {};
      var url = "".concat(serverBase, "VectorLayer/Search.ashx");
      url += '?layer=' + params.layerID;

      if (params.id) {
        '&query=gmx_id=' + params.id;
      }

      url += '&out_cs=EPSG:4326';
      url += '&geometry=true';
      return getReq(url);
    };

    var getReportsCount = function getReportsCount() {
      return getReq(serverProxy + '?path=/rest/v1/get-current-user-info');
    };

    var Requests = {
      parseURLParams: parseURLParams,
      getMapTree: getMapTree,
      getReportsCount: getReportsCount,
      getLayerItems: getLayerItems
    };

    var dataWorker = new WorkerFactory();
    var urlPars = Requests.parseURLParams();
    console.log('urlPars', urlPars); //dataWorker.postMessage('Hello World!');

    var Utils = {
      saveState: function saveState(data, key) {
        key = key || 'Forest_';
        window.localStorage.setItem(key, JSON.stringify(data));
      },
      getState: function getState(key) {
        key = key || 'Forest_';
        return JSON.parse(window.localStorage.getItem(key)) || {};
      },
      isDelynkaLayer: function isDelynkaLayer(it) {
        var out = false;

        if (it._gmx) {
          var attr = it._gmx.tileAttributeTypes;
          out = attr.snap && attr.FRSTAT;
        }

        return out;
      },
      isKvartalLayer: function isKvartalLayer(it) {
        var out = false;

        if (it._gmx) {
          var attr = it._gmx.tileAttributeTypes;
          out = attr.kv;
        }

        return out;
      },
      getLayerItems: function getLayerItems(it, opt) {
        dataWorker.onmessage = function (res) {
          var data = res.data,
              cmd = data.cmd,
              json = data.out,
              type = opt && opt.type || 'delynka';

        };

        dataWorker.postMessage({
          cmd: 'getLayerItems',
          layerID: it.options.layerID,
          opt: opt
        });
      },
      getReportsCount: function getReportsCount(opt) {
        dataWorker.onmessage = function (res) {
          var data = res.data,
              cmd = data.cmd,
              json = data.out;
        };

        dataWorker.postMessage({
          cmd: 'getReportsCount',
          opt: opt
        });
      },
      getMap: function getMap(opt) {
        return new Promise(function (resolve, reject) {
          dataWorker.onmessage = function (res) {
            var data = res.data,
                cmd = data.cmd,
                json = data.out;

            if (cmd === 'getMap') {
              resolve(json);
            } // console.log('onmessage', json);

          };

          dataWorker.postMessage({
            cmd: 'getMap',
            mapID: urlPars.main.length ? urlPars.main[0] : opt.mapID,
            search: location.search
          });
        });
      }
    };
    L.Map.addInitHook(function () {
      var map = this;
      map.on('layeradd', function (ev) {
        console.log('layeradd', ev);
        var it = ev.layer,
            _gmx = it._gmx;
        return new Promise(function (resolve) {
          if (_gmx) {
            dataWorker.onmessage = function (res) {
              var data = res.data,
                  cmd = data.cmd,
                  json = data.out;

              if (cmd === 'addDataSource') {
                resolve(json);
              }
            };

            dataWorker.postMessage({
              cmd: 'addDataSource',
              id: _gmx.layerID,
              hostName: _gmx.hostName
            });
          } else {
            resolve({
              error: 'Not Geomixer layer'
            });
          }
        });
      }).on('layerremove', function (ev) {
        console.log('layerremove', ev);
        var it = ev.layer,
            _gmx = it._gmx;
        return new Promise(function (resolve) {
          if (_gmx) {
            dataWorker.onmessage = function (res) {
              var data = res.data,
                  cmd = data.cmd,
                  json = data.out;

              if (cmd === 'removeDataSource') {
                resolve(json);
              }
            };

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
      });
    });

    exports.Utils = Utils;
    exports.dataWorker = dataWorker;

    return exports;

}({}));
//# sourceMappingURL=index.js.map
