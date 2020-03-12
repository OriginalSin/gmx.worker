import Requests from './Requests.js';
import DataVersion from './DataSourceVersion';
import Renderer2d from './Renderer2d';

var _self = self;
(_self.on || _self.addEventListener).call(_self, 'message', e => {
    const message = e.data || e;
// console.log('in message ', e);
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
			DataVersion.getTiles(message)
			.then(arr => {
console.log('getTiles111 ', arr);
				message.out = arr;
				_self.postMessage(message);
			});
			break;
		case 'addCanvasTile':
			const canvas = new OffscreenCanvas(256, 256),
			// const canvas = message.canvas,
				w = canvas.width,
				h = canvas.height,
				ctx = canvas.getContext('2d');
				// gl = canvas.getContext('webgl');
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
				_parts: message._parts || [[{"x":0,"y":0},{"x":255,"y":255},{"x":255,"y":0},{"x":0,"y":255}]]
				// _parts: message._parts || [[{"x":54,"y":40},{"x":95,"y":40},{"x":95,"y":88}]]
			});
			// delete message. ;
			message.out = {done: true};
			message.bitmap = canvas.transferToImageBitmap();
			_self.postMessage(message, [message.bitmap]);
			break;
		case 'getLayerItems':
			Requests.getLayerItems({layerID: message.layerID}).then((json) => {
				message.out = json;
				let pt = {};
				json.Result.fields.forEach((name, i) => { pt[name] = i; });
				json.Result.fieldKeys = pt;
				_self.postMessage(message);
			});
			break;
		case 'getMap':
			DataVersion.getMapTree({mapID: message.mapID, apiKey: message.apiKey, hostName: message.hostName, search: message.search}).then((json) => {
			// Requests.getMapTree({mapID: message.mapID, hostName: message.hostName, search: message.search}).then((json) => {
				message.out = json;
				_self.postMessage(message);
			});
			break;
		case 'setSyncParams':
			Requests.setSyncParams(message.syncParams);
			break;
		case 'getSyncParams':
			message.syncParams = Requests.getSyncParams(message.stringFlag);
			_self.postMessage(message);
			break;
		case 'addDataSource':
			DataVersion.addSource(message);
			// .then((json) => {
				// message.out = json;
				// _self.postMessage(message);
			// });
			break;
		case 'removeDataSource':
			DataVersion.removeSource({id: message.id, hostName: message.hostName});
			break;
		case 'addObserver':
			DataVersion.addObserver(message).then((json) => {
				message.out = json;
		console.log('vvvvvvvvvv ___res____ ', message);
				_self.postMessage(message);
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

