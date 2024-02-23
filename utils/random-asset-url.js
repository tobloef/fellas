import { randomInt } from './random-int.js';

export function randomAssetUrl(urlFunc, variations, unique = true) {
	const variation = variations[randomInt(0, variations.length - 1)];
	let url = urlFunc(variation);

	if (unique) {
		url += `?${Math.random()}`;
	}

	return url;
}
