var gmxWorker = (function (exports) {
    'use strict';

    const kIsNodeJS = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
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
    const WorkerFactory = createURLWorkerFactory('geomixer/external/gmx.worker/dist/web-worker-0.js');
    /* eslint-enable */

    const _self = self || window,
          serverBase = _self.serverBase || '//maps.kosmosnimki.ru/',
          serverProxy = serverBase + 'Plugins/ForestReport/proxy';

    const parseURLParams = str => {
      let sp = new URLSearchParams(str || location.search),
          out = {},
          arr = [];

      for (let p of sp) {
        let k = p[0],
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

      return {
        main: arr,
        keys: out
      };
    };

    const getMapTree = params => {
      params = params || {};
      console.log('parseURLParams', parseURLParams(params.search));
      let url = `${serverBase}Map/GetMapFolder`;
      url += '?mapId=' + (params.mapId || 'C8612B3A77D84F3F87953BEF17026A5F');
      url += '&folderId=root';
      url += '&srs=3857';
      url += '&skipTiles=All';
      url += '&visibleItemOnly=false';
      return fetch(url, {
        method: 'get',
        mode: 'cors',
        credentials: 'include' // headers: {'Accept': 'application/json'},
        // body: JSON.stringify(params)	// TODO: сервер почему то не хочет работать так https://googlechrome.github.io/samples/fetch-api/fetch-post.html

      }).then(res => {
        return res.json();
      }).then(json => {
        return parseTree(json);
      }).catch(err => console.warn(err));
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
          let ph = {
            level: level,
            properties: props
          };

          if (content.geometry) {
            ph.geometry = content.geometry;
          }

          out.layers.push(ph);
        } else if (type === 'group') {
          let childs = content.children || [];
          out.layers.push({
            level: level,
            group: true,
            childsLen: childs.length,
            properties: props
          });
          childs.map(it => {
            _iterateNodeChilds(it, level + 1, out);
          });
        }
      } else {
        return out;
      }

      return out;
    };

    const parseTree = json => {
      let out = {};

      if (json.Status === 'error') {
        out = json;
      } else if (json.Result && json.Result.content) {
        out = _iterateNodeChilds(json.Result);
        out.mapAttr = out.layers.shift();
      } // console.log('______json_out_______', out, json)


      return out;
    };

    const getReq = url => {
      return fetch(url, {
        method: 'get',
        mode: 'cors',
        credentials: 'include' // headers: {'Accept': 'application/json'},
        // body: JSON.stringify(params)	// TODO: сервер почему то не хочет работать так https://googlechrome.github.io/samples/fetch-api/fetch-post.html

      }).then(res => res.json()).catch(err => console.warn(err));
    };

    const getLayerItems = params => {
      params = params || {};
      let url = `${serverBase}VectorLayer/Search.ashx`;
      url += '?layer=' + params.layerID;

      if (params.id) {
        '&query=gmx_id=' + params.id;
      }

      url += '&out_cs=EPSG:4326';
      url += '&geometry=true';
      return getReq(url);
    };

    const getReportsCount = () => {
      return getReq(serverProxy + '?path=/rest/v1/get-current-user-info');
    };

    var Requests = {
      parseURLParams,
      getMapTree,
      getReportsCount,
      getLayerItems
    };

    const dataWorker = new WorkerFactory(); //dataWorker.postMessage('Hello World!');

    const Utils = {
      saveState: (data, key) => {
        key = key || 'Forest_';
        window.localStorage.setItem(key, JSON.stringify(data));
      },
      getState: key => {
        key = key || 'Forest_';
        return JSON.parse(window.localStorage.getItem(key)) || {};
      },
      isDelynkaLayer: it => {
        let out = false;

        if (it._gmx) {
          let attr = it._gmx.tileAttributeTypes;
          out = attr.snap && attr.FRSTAT;
        }

        return out;
      },
      isKvartalLayer: it => {
        let out = false;

        if (it._gmx) {
          let attr = it._gmx.tileAttributeTypes;
          out = attr.kv;
        }

        return out;
      },
      getLayerItems: (it, opt) => {
        dataWorker.onmessage = res => {
          let data = res.data,
              cmd = data.cmd,
              json = data.out,
              type = opt && opt.type || 'delynka';

          if (cmd === 'getLayerItems') {
            if (type === 'delynka') {
              delItems.set(json.Result);
            } else {
              kvItems.set(json.Result);
            }
          } // console.log('onmessage', res);

        };

        dataWorker.postMessage({
          cmd: 'getLayerItems',
          layerID: it.options.layerID,
          opt: opt
        });
      },
      getReportsCount: opt => {
        dataWorker.onmessage = res => {
          let data = res.data,
              cmd = data.cmd,
              json = data.out;

          if (cmd === 'getReportsCount') {
            reportsCount.set(json);
          }
        };

        dataWorker.postMessage({
          cmd: 'getReportsCount',
          opt: opt
        });
      },
      getMap: opt => {
        return new Promise((resolve, reject) => {
          dataWorker.onmessage = res => {
            let data = res.data,
                cmd = data.cmd,
                json = data.out;

            if (cmd === 'getMap') {
              mapTree.set(json);
            } // console.log('onmessage', json);

          };

          let pars = Requests.parseURLParams(location.search);
          dataWorker.postMessage({
            cmd: 'getMap',
            mapID: pars.main.length ? pars.main[0] : mapID,
            search: location.search
          });
        });
      }
    };

    exports.Utils = Utils;
    exports.dataWorker = dataWorker;

    return exports;

}({}));
//# sourceMappingURL=index.js.map
