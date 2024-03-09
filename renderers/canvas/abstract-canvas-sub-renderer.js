export class AbstractCanvasSubRenderer {
	constructor(state, containerElement) {
		if (new.target === AbstractCanvasSubRenderer) {
			throw new TypeError(`Cannot construct ${AbstractCanvasSubRenderer.name} instances directly.`);
		}
	}

	async setup() {
		throw new TypeError(`Cannot call static method ${this.setup.name} of ${AbstractCanvasSubRenderer.name} directly.`);
	}

	async updateDisplaySize() {
		throw new TypeError(`Cannot call static method ${this.updateDisplaySize.name} of ${AbstractCanvasSubRenderer.name} directly.`);
	}

	async updateCamera() {
		throw new TypeError(`Cannot call static method ${this.updateCamera.name} of ${AbstractCanvasSubRenderer.name} directly.`);
	}

	async loop() {
		throw new TypeError(`Cannot call static method ${this.loop.name} of ${AbstractCanvasSubRenderer.name} directly.`);
	}

	async destroy() {
		throw new TypeError(`Cannot call static method ${this.destroy.name} of ${AbstractCanvasSubRenderer.name} directly.`);
	}
}
