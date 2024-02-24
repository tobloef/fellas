export class AbstractRenderer {
	constructor() {
		if (new.target === AbstractRenderer) {
			throw new TypeError('Cannot construct AbstractRenderer instances directly');
		}
	}

	static create(state, containerElement) {
		throw new TypeError('Cannot call static method create of AbstractRenderer directly');
	}

	destroy() {
		throw new TypeError('Cannot call method destroy of AbstractRenderer directly');
	}
}
