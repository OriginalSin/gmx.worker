import Requests from './Requests.js';
import DataVersion from './DataSourceVersion';

var _self = self;
(_self.on || _self.addEventListener).call(_self, 'message', e => {
    const message = e.data || e;
console.log('message ', e);
    switch (message.cmd) {
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
			DataVersion.getMapTree({mapID: message.mapID, hostName: message.hostName, search: message.search}).then((json) => {
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

