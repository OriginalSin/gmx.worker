var _self = self || window,
    serverBase = _self.serverBase || '//maps.kosmosnimki.ru/',
    serverProxy = serverBase + 'Plugins/ForestReport/proxy';

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

var getMapTree = function getMapTree(params) {
  params = params || {};
  console.log('parseURLParams', parseURLParams(params.search));
  var url = "".concat(serverBase, "Map/GetMapFolder");
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

  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    return parseTree(json);
  }).catch(function (err) {
    return console.warn(err);
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

var _self$1 = self;

(_self$1.on || _self$1.addEventListener).call(_self$1, 'message', function (e) {
  var message = e.data || e;
  console.log('message ', e);

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
        search: message.search
      }).then(function (json) {
        message.out = json;

        _self$1.postMessage(message);
      });
      break;

    case 'getReportsCount':
      Requests.getReportsCount().then(function (json) {
        message.out = json;

        _self$1.postMessage(message);
      });
      break;

    default:
      console.warn('Неизвестная команда:', message.cmd);
      break;
  }
});
//# sourceMappingURL=web-worker-0.js.map
