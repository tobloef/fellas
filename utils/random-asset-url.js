import { randomChoice } from './random.js';

export function randomAssetUrl(urlFunc, variations, unique = true) {
	const variation = randomChoice(variations);
	let url = urlFunc(variation);

	if (unique) {
		url += `?${Math.random()}`;
	}

	return url;
}
