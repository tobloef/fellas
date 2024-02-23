/** @abstract */
export class RendererModule {
	/**
	 * @param {HTMLElement} containerElement
	 * @abstract
	 */
	initialize(
		containerElement,
	) {}

	/** @abstract */
	updateCount() {}

	/** @abstract */
	updateSize() {}

	/** @abstract */
	updateSprites() {}

	/** @abstract */
	updateCamera() {}

	/** @abstract */
	destroy() {}
}
