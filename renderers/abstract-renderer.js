export class AbstractRenderer {
	constructor() {
		if (new.target === AbstractRenderer) {
			throw new TypeError(`Cannot construct ${AbstractRenderer.name} instances directly.`);
		}
	}

	initialize(state, containerElement) {
		throw new TypeError(`Cannot call static method ${this.initialize.name} of ${AbstractRenderer.name} directly.`);
	}

	destroy() {
		throw new TypeError(`Cannot call method ${this.destroy.name} of ${AbstractRenderer.name} directly.`);
	}
}
