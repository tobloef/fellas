export class AbstractRenderer {
	constructor() {
		if (new.target === AbstractRenderer) {
			throw new TypeError('Cannot construct AbstractRenderer instances directly');
		}
	}

	async initialize(state, containerElement) {
		throw new TypeError('Cannot call static method create of AbstractRenderer directly');
	}

	async destroy() {
		throw new TypeError('Cannot call method destroy of AbstractRenderer directly');
	}
}
