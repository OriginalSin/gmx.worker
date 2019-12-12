import Requests from './Requests';

const HOST = 'maps.kosmosnimki.ru',
        // this.tileSenderPrefix = L.gmxUtil.protocol + '//' + hostName + '/' +
            // 'TileSender.ashx?WrapStyle=None' +
            // '&key=' + encodeURIComponent(sessionKey);

    WORLDWIDTHFULL = 40075016.685578496,
	W = WORLDWIDTHFULL / 2,
	WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx';

let hosts = {},
    zoom = 3,
    bbox = null,
	// dataManagersLinks = {},
    // hostBusy = {},
    // needReq = {}
    delay = 60000,
	intervalID = null,
    timeoutID = null;

const load = (pars) => {
	pars = pars || {};
console.log('load:', pars);
	if (!pars.signals) { pars.signals = {}; }
	return new Promise((resolve, reject) => {
		let arr = [];
		let pb = pars.tiles;
		for (let i = 0, len = pb.length; i < len; i+=6) {
			arr.push(Requests.getJson({
				url: '//' + pars.hostName + '/TileSender.ashx',
				options: Requests.chkSignal('TileLoader', pars.signals, {
					mode: 'cors',
					credentials: 'include'
				}),
				paramsArr: [Requests.COMPARS, {
					z: pb[i], x: pb[i + 1], y: pb[i + 2], v: pb[i + 3], Level: pb[i + 4], Span: pb[i + 5],
					LayerName: pars.id,
					// bboxes: JSON.stringify(bbox || [WORLDBBOX]),
					// generalizedTiles: false,
					// zoom: zoom
				}]
			}).then(json => {
				delete pars.signals.TileLoader;
				return json;
			})
			.catch(err => {
				console.error(err);
				// resolve('');
			})
			);

		}
	});
};

export default {
	load
};