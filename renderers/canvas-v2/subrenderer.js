export class CanvasSubrenderer {
	containerElement = null;
	state = null;

	constructor(state, containerElement) {
		this.state = state;
		this.containerElement = containerElement;
	}

	setup() {
		throw new Error('Extended class must implement own setup method.');
	}

	updateCamera() {
		throw new Error('Extended class must implement own updateCamera method.');
	}

	updateScreenSize() {
		throw new Error('Extended class must implement own updateScreenSize method.');
	}

	destroy() {
		throw new Error('Extended class must implement own destroy method.');
	}
}
